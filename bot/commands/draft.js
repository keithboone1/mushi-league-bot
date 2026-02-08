import {
  SlashCommandBuilder,
  roleMention,
  codeBlock,
  userMention,
} from "discord.js";
import {
  rightAlign,
  fixFloat,
  userIsCaptain,
  userIsCoach,
  userIsOwner,
  baseFunctionlessHandler,
  baseHandler,
} from "./util.js";
import { currentSeason, channels, setCurrentSeason } from "../globals.js";
import {
  loadPlayerFromSnowflake,
  loadRosterSize,
  savePlayerChange,
  loadUndraftedPlayers,
  getSeasonSize,
} from "../../database/player.js";
import {
  loadNextPickTeam,
  saveDraftPick,
  saveWithdrawTeam,
  loadNextPickRoundForTeam,
  saveDraftSetup,
} from "../../database/draft.js";
import {
  loadTeamFromSnowflake,
  loadTeamsInLimitedPickOrder,
} from "../../database/team.js";
import { saveSeasonNumbers } from "../../database/season.js";

const OVERFLOW_SIZE = 3;

export const DRAFT_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("draft")
    .setDescription("commands for drafting players")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription(
          "shows all players you can draft in descending star order",
        )
        .addBooleanOption((option) =>
          option
            .setName("public")
            .setDescription("whether to show the list publicly"),
        )
        .addBooleanOption((option) =>
          option
            .setName("all")
            .setDescription(
              "whether to list all players (instead of just those you can draft)",
            ),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("pick")
        .setDescription("adds an available player to your team")
        .addUserOption((option) =>
          option
            .setName("player")
            .setDescription("player to draft")
            .setRequired(true),
        )
        .addBooleanOption((option) =>
          option
            .setName("override")
            .setDescription("true if you are drafting for another team"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("withdraw")
        .setDescription("withdraws this team from the draft")
        .addRoleOption((option) =>
          option
            .setName("team")
            .setDescription("team to withdraw, defaults to your own"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("init")
        .setDescription("sets draft order")
        .addStringOption((option) =>
          option
            .setName("order")
            .setDescription(
              'order of team picks in format "5,4,1,2,3,6" (this is ghetto af)',
            )
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("start").setDescription("starts the draft"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("finalize")
        .setDescription("saves rosters, initializes pstats"),
    ),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case "list":
        await listPlayers(interaction);
        break;
      case "pick":
        await pickPlayer(interaction);
        break;
      case "withdraw":
        await withdrawTeam(interaction);
        break;
      case "init":
        await initDraft(interaction);
        break;
      case "start":
        await startDraft(interaction);
        break;
      case "finalize":
        await finalizeDraft(interaction);
        break;
    }
  },
};

async function listPlayers(interaction) {
  const ephemeral = !interaction.options.getBoolean("public");

  async function dataCollector(interaction) {
    const listAll = interaction.options.getBoolean("all");

    const submitter = await loadPlayerFromSnowflake(interaction.user.id);

    if (!submitter?.teamId && !listAll) {
      return {
        failure:
          "You must be on a team to use this command without the 'all' option.",
      };
    }

    const maxStars = listAll
      ? 10
      : fixFloat(
          await maxStarsNext(
            submitter?.teamId,
            (
              await loadNextPickRoundForTeam(
                submitter?.teamId,
                currentSeason.number,
              )
            ).round,
          ),
        );

    const availablePlayers = await loadUndraftedPlayers(maxStars);

    return {
      teamSnowflake: submitter?.teamSnowflake,
      maxStars,
      listAll,
      availablePlayers,
    };
  }

  function verifier(data) {}

  function responseWriter(data) {
    const { teamSnowflake, maxStars, listAll, availablePlayers } = data;
    const header = listAll
      ? "All available players"
      : `Players available to ${roleMention(
          teamSnowflake,
        )} (max stars for next pick: ${maxStars}):\n`;
    return header.concat(prettyDraftList(availablePlayers));
  }

  await baseFunctionlessHandler(
    interaction,
    dataCollector,
    verifier,
    responseWriter,
    ephemeral,
    false,
  );
}

function prettyDraftList(availablePlayers) {
  if (availablePlayers.length === 0) {
    return "Nobody left!";
  }

  return codeBlock(
    "".concat(
      "Stars | Player \n",
      "------|--------\n",
      availablePlayers.map((player) => prettyTextPlayer(player)).join("\n"),
    ),
  );
}

function prettyTextPlayer(player) {
  return `${rightAlign(6, player.stars.toFixed(2))}| ${player.name}`;
}

async function maxStarsNext(teamId, round) {
  if (round === 1) {
    const captainStars = await loadRosterSize(teamId, true);

    return currentSeason.r1_stars - captainStars.stars;
  } else {
    const roster = await loadRosterSize(teamId, false);

    return (
      currentSeason.max_stars -
      roster.stars -
      (currentSeason.max_roster - 1 - roster.size) * 2
    );
  }
}

async function pickPlayer(interaction) {
  async function dataCollector(interaction) {
    if (
      !userIsCaptain(interaction.member) &&
      !userIsCoach(interaction.member) &&
      !userIsOwner(interaction.member)
    ) {
      return {
        failure: "You must be a captain, coach, or owner to use this command.",
      };
    }

    const player = interaction.options.getMember("player");
    const override = interaction.options.getBoolean("override");

    if (override && !userIsOwner(interaction.member)) {
      return { failure: "You must be an owner to use the override" };
    }

    const submitter = await loadPlayerFromSnowflake(interaction.user.id);

    if (!submitter.teamId && !override) {
      return {
        failure:
          "You must be on a team to use this command without the override.",
      };
    }

    const nextPickTeam = await loadNextPickTeam(currentSeason.number);

    const team = override
      ? {
          teamId: nextPickTeam.teamId,
          teamSnowflake: nextPickTeam.discord_snowflake,
        }
      : { teamId: submitter.teamId, teamSnowflake: submitter.teamSnowflake };

    const maxStars = fixFloat(
      await maxStarsNext(team.teamId, nextPickTeam.round),
    );
    let playerData = await loadPlayerFromSnowflake(player.id);

    if (!playerData) {
      return { failure: `${userMention(player.id)} is not in the pool` };
    }

    playerData.stars = fixFloat(playerData.stars);
    playerData.roles = player.roles;

    return {
      team,
      maxStars,
      pick: playerData,
      nextPickTeam,
      override,
      draftId: nextPickTeam.draftId,
    };
  }

  function verifier(data) {
    const { team, maxStars, pick, override, nextPickTeam } = data;
    let failures = [],
      prompts = [];

    if (nextPickTeam.teamId !== team.teamId) {
      failures.push(
        `It's not your pick! It's ${roleMention(
          nextPickTeam.discord_snowflake,
        )}'s turn`,
      );
    }

    // if (pick.teamId !== null) {
    //   failures.push(
    //     `${userMention(pick.discord_snowflake)} is already on a team!`,
    //   );
    // }

    if (!pick.active) {
      failures.push(
        `${userMention(pick.discord_snowflake)} is not playing this season!`,
      );
    }

    if (pick.stars > maxStars) {
      failures.push(
        `${userMention(
          pick.discord_snowflake,
        )} is too expensive! Your budget: ${maxStars} stars.`,
      );
    }

    if (override) {
      prompts.push(
        `You're drafting for the ${roleMention(
          team.teamSnowflake,
        )}, but you aren't on that team.`,
      );
    }

    prompts.push(
      `Confirm that you want to draft ${userMention(
        pick.discord_snowflake,
      )} for ${pick.stars} stars.`,
    );

    const confirmLabel = "Confirm Draft";
    const confirmMessage = `${userMention(
      pick.discord_snowflake,
    )} drafted to ${roleMention(team.teamSnowflake)} for ${pick.stars} stars.`;
    const cancelMessage = `${userMention(pick.discord_snowflake)} not drafted.`;

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    const { team, pick, draftId } = data;

    await recordDraftPick(draftId, team, pick);
    await notifyAfterPick();
  }

  await baseHandler(
    interaction,
    dataCollector,
    verifier,
    onConfirm,
    false,
    false,
  );
}

async function recordDraftPick(draftId, team, pick) {
  await saveDraftPick(draftId, pick.id);
  await pick.roles.add([process.env.playerRoleId, team.teamSnowflake]);
  await savePlayerChange(
    pick.id,
    pick.name,
    pick.discord_snowflake,
    pick.stars,
    team.teamId,
    1,
    pick.active,
    currentSeason.number,
    currentSeason.current_week,
  );
}

async function notifyAfterPick() {
  const availablePlayers = await loadUndraftedPlayers(10);

  if (availablePlayers.length === 0) {
    const draftChannel = await channels.fetch(process.env.draftChannelId);
    await draftChannel.send({
      content: `${roleMention(
        process.env.ownerRoleId,
      )} all players have been drafted. After confirming the #registration channel has nobody left, run /draft finalize.`,
      allowedMentions: { parse: ["roles"] },
    });
  } else {
    await pingNextTeam();
  }
}

async function pingNextTeam() {
  const nextPickTeam = await loadNextPickTeam(currentSeason.number);
  const maxStars = fixFloat(
    await maxStarsNext(nextPickTeam.teamId, nextPickTeam.round),
  );
  await sendDraftPing(nextPickTeam.discord_snowflake, maxStars);
}

async function withdrawTeam(interaction) {
  async function dataCollector(interaction) {
    if (
      !userIsCaptain(interaction.member) &&
      !userIsCoach(interaction.member) &&
      !userIsOwner(interaction.member)
    ) {
      return {
        failure: "You must be a captain, coach, or owner to use this command.",
      };
    }

    const team = interaction.options.getRole("team");

    const submitter = await loadPlayerFromSnowflake(interaction.user.id);

    if (!submitter.teamId && !team) {
      return { failure: "You must be on a team to use this command." };
    }

    const overriddenTeam = team != null && team.id !== submitter.teamSnowflake;

    if (overriddenTeam && !userIsOwner(interaction.member)) {
      return {
        failure: "You must be an owner to withdraw someone else's team",
      };
    }

    const teamData = overriddenTeam
      ? await loadTeamFromSnowflake(team.id)
      : { id: submitter.teamId, discord_snowflake: submitter.teamSnowflake };

    const rosterSize = (await loadRosterSize(teamData.id, false)).size;

    const teamIsUp =
      (await loadNextPickTeam(currentSeason.number)).discord_snowflake ===
      teamData.teamSnowflake;

    return { submitter, team: teamData, rosterSize, overriddenTeam, teamIsUp };
  }

  function verifier(data) {
    const { team, rosterSize, overriddenTeam } = data;
    let failures = [],
      prompts = [];

    if (rosterSize < currentSeason.min_roster) {
      failures.push(
        `You can't withdraw ${roleMention(
          team.discord_snowflake,
        )} because they have less than ${currentSeason.min_roster} players.`,
      );
    }

    if (overriddenTeam) {
      prompts.push(
        `You are withdrawing ${roleMention(
          team.discord_snowflake,
        )} but you are not on that team.`,
      );
    }

    prompts.push(
      `Do you really want to withdraw ${roleMention(
        team.discord_snowflake,
      )} from the draft? This can't be undone.`,
    );

    const confirmLabel = "Confirm Withdrawal";
    const confirmMessage = `${roleMention(
      team.discord_snowflake,
    )} withdrawn from the draft.`;
    const cancelMessage = `${roleMention(
      team.discord_snowflake,
    )} not withdrawn.`;

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    await saveWithdrawTeam(data.team.id);

    if (data.teamIsUp) {
      await pingNextTeam();
    }
  }

  await baseHandler(
    interaction,
    dataCollector,
    verifier,
    onConfirm,
    false,
    false,
  );
}

async function initDraft(interaction) {
  async function dataCollector(interaction) {
    if (!userIsOwner(interaction.member)) {
      return { failure: "You must be an owner to use this command." };
    }

    const order = interaction.options.getString("order").split(",");
    const teams = await loadTeamsInLimitedPickOrder();
    const teamOrder = order.map((id) =>
      teams.find((team) => team.id === Number(id)),
    );

    const seasonSize = await getSeasonSize();
    const flooredPlayersPerTeam = Math.floor(
      seasonSize.playerCount / teams.length,
    );
    const remainder = seasonSize.playerCount % teams.length;
    const minRoster =
      remainder > teams.length / 2
        ? flooredPlayersPerTeam
        : flooredPlayersPerTeam - 1;
    const maxRoster = minRoster + OVERFLOW_SIZE;

    const r1stars = teams[0].priciestCaptain + 2;
    const leftoverPlayers = seasonSize.playerCount - minRoster * teams.length;
    const draftCap =
      Math.ceil(
        (10 *
          (seasonSize.starCount + 0.5 * teams.length - 2 * leftoverPlayers)) /
          teams.length,
      ) / 10;
    const maxStars = draftCap + 2 * OVERFLOW_SIZE;

    const minLineupBeforeOdding = Math.floor(minRoster * 0.7);
    const minLineup =
      minLineupBeforeOdding % 2 === 1
        ? minLineupBeforeOdding
        : minLineupBeforeOdding - 1;

    return {
      teams,
      teamOrder,
      minRoster,
      maxRoster,
      draftCap,
      maxStars,
      r1stars,
      minLineup,
    };
  }

  function verifier(data) {
    const { teams, teamOrder, minRoster, draftCap, r1stars, minLineup } = data;
    let failures = [],
      prompts = [];

    prompts.push(
      `Limited round order: ${teams
        .map((team) => roleMention(team.discord_snowflake))
        .join(", ")}`,
    );
    prompts.push(
      `Normal order: ${teamOrder
        .map((team) => roleMention(team.discord_snowflake))
        .join(", ")}`,
    );
    prompts.push(
      `Season numbers: Min roster size ${minRoster};` +
        ` draft cap ${draftCap} + 2 per player over min;` +
        ` limited round stars ${r1stars};` +
        ` min lineup size ${minLineup}`,
    );

    const confirmLabel = "Confirm Initialize Draft";
    const confirmMessage = `Draft initialized`;
    const cancelMessage = `Draft not initialized`;

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    const {
      teams,
      teamOrder,
      minRoster,
      maxRoster,
      maxStars,
      r1stars,
      minLineup,
    } = data;

    await saveSeasonNumbers(
      currentSeason.number,
      minRoster,
      maxRoster,
      maxStars,
      r1stars,
      minLineup,
    );

    await setCurrentSeason();

    await saveDraftSetup(
      currentSeason.number,
      currentSeason.max_roster,
      teams.map((team) => team.id),
      teamOrder.map((team) => team.id),
    );
  }

  await baseHandler(
    interaction,
    dataCollector,
    verifier,
    onConfirm,
    false,
    false,
  );
}

async function startDraft(interaction) {
  async function dataCollector(interaction) {
    if (!userIsOwner(interaction.member)) {
      return { failure: "You must be an owner to use this command." };
    }

    const firstPickTeam = await loadNextPickTeam(currentSeason.number);

    if (!firstPickTeam) {
      return { failure: "There does not seem to be a draft upcoming" };
    }

    const maxStars = fixFloat(
      await maxStarsNext(firstPickTeam.teamId, firstPickTeam.round),
    );

    return { firstPickTeam, maxStars };
  }

  function verifier(data) {
    let failures = [],
      prompts = [];

    const confirmLabel = "Confirm Start Draft";
    const confirmMessage = `Draft begun.`;
    const cancelMessage = `Draft not begun.`;

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    // await sendDraftPing(data.firstPickTeam.discord_snowflake, data.maxStars);
  }

  await baseHandler(
    interaction,
    dataCollector,
    verifier,
    onConfirm,
    false,
    false,
  );
}

async function sendDraftPing(teamSnowflake, maxStars) {
  const draftChannel = await channels.fetch(process.env.draftChannelId);
  await draftChannel.send({
    content: `${roleMention(
      teamSnowflake,
    )}, your pick. Max stars is ${maxStars}.`,
    allowedMentions: { parse: ["roles"] },
  });
}
