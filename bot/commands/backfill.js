import { SlashCommandBuilder, roleMention, userMention } from "discord.js";
import { loadTeamFromSnowflake } from "../../database/team.js";
import {
  loadPlayerFromUsername,
  saveNewPlayer,
} from "../../database/player.js";
import {
  loadPlayerOnRoster,
  saveBackfillPlayer,
  saveBackfillRoster,
} from "../../database/roster.js";
import {
  saveBackfillStandings,
  saveRecalculateStandings,
} from "../../database/standing.js";
import {
  userIsMod,
  baseHandler,
  userIsBackfiller,
  passThroughVerifier,
} from "./util.js";
import { loadPlayerFromSnowflake } from "../../database/player.js";
import {
  loadOnePairing,
  savePairingResult,
  saveLineupSubmission,
} from "../../database/pairing.js";
import {
  loadMatchupForTeam,
  saveMatchupSubmission,
  loadExistingPairingForMatchup,
  saveOneNewMatchup,
} from "../../database/matchup.js";
import { loadExistingRoster, loadRoster } from "../../database/roster.js";
import { saveBackfillSeason } from "../../database/season.js";
import { saveNewWeeks } from "../../database/week.js";
import { addTeam } from "./season.js";
import { saveRecalculatePstats } from "../../database/pstat.js";
import { loadRoleFromSnowflake } from "../../database/role.js";

export const BACKFILL_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("backfill")
    .setDescription(
      "backfill bot data for previous seasons DO NOT USE WITHOUT ASKING",
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("team")
        .setDescription("backfill a team")
        .addRoleOption((option) =>
          option.setName("role").setDescription("team role").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("emoji").setDescription("team emoji"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("season")
        .setDescription("backfill a season")
        .addNumberOption((option) =>
          option.setName("season").setDescription("season").setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("num_weeks")
            .setDescription("number of weeks")
            .setRequired(true),
        )
        .addNumberOption((option) =>
          option
            .setName("playoff_size")
            .setDescription("playoff size")
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option.setName("team1").setDescription("team1"),
        )
        .addRoleOption((option) =>
          option.setName("team2").setDescription("team2"),
        )
        .addRoleOption((option) =>
          option.setName("team3").setDescription("team3"),
        )
        .addRoleOption((option) =>
          option.setName("team4").setDescription("team4"),
        )
        .addRoleOption((option) =>
          option.setName("team5").setDescription("team5"),
        )
        .addRoleOption((option) =>
          option.setName("team6").setDescription("team6"),
        )
        .addRoleOption((option) =>
          option.setName("team7").setDescription("team7"),
        )
        .addRoleOption((option) =>
          option.setName("team8").setDescription("team8"),
        )
        .addRoleOption((option) =>
          option.setName("team9").setDescription("team9"),
        )
        .addRoleOption((option) =>
          option.setName("team10").setDescription("team10"),
        )
        .addRoleOption((option) =>
          option.setName("team11").setDescription("team11"),
        )
        .addRoleOption((option) =>
          option.setName("team12").setDescription("team12"),
        )
        .addRoleOption((option) =>
          option.setName("team13").setDescription("team13"),
        )
        .addRoleOption((option) =>
          option.setName("team14").setDescription("team14"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("player")
        .setDescription("backfill a single player")
        .addNumberOption((option) =>
          option.setName("season").setDescription("season").setRequired(true),
        )
        .addRoleOption((option) =>
          option.setName("team").setDescription("team").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("user").setDescription("user").setRequired(true),
        )
        .addRoleOption((option) =>
          option.setName("role").setDescription("role").setRequired(true),
        )
        .addNumberOption((option) =>
          option.setName("dropped_week").setDescription("week dropped"),
        )
        .addNumberOption((option) =>
          option.setName("picked_up_week").setDescription("week picked up"),
        )
        .addNumberOption((option) =>
          option.setName("stars").setDescription("stars"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("roster")
        .setDescription("backfill a roster")
        .addNumberOption((option) =>
          option.setName("season").setDescription("season").setRequired(true),
        )
        .addRoleOption((option) =>
          option.setName("team").setDescription("team").setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("cap1").setDescription("captain 1"),
        )
        .addStringOption((option) =>
          option.setName("cap2").setDescription("captain 2"),
        )
        .addStringOption((option) =>
          option.setName("coach").setDescription("coach"),
        )
        .addStringOption((option) =>
          option.setName("p1").setDescription("player 1"),
        )
        .addStringOption((option) =>
          option.setName("p2").setDescription("player 2"),
        )
        .addStringOption((option) =>
          option.setName("p3").setDescription("player 3"),
        )
        .addStringOption((option) =>
          option.setName("p4").setDescription("player 4"),
        )
        .addStringOption((option) =>
          option.setName("p5").setDescription("player 5"),
        )
        .addStringOption((option) =>
          option.setName("p6").setDescription("player 6"),
        )
        .addStringOption((option) =>
          option.setName("p7").setDescription("player 7"),
        )
        .addStringOption((option) =>
          option.setName("p8").setDescription("player 8"),
        )
        .addStringOption((option) =>
          option.setName("p9").setDescription("player 9"),
        )
        .addStringOption((option) =>
          option.setName("p10").setDescription("player 10"),
        )
        .addStringOption((option) =>
          option.setName("p11").setDescription("player 11"),
        )
        .addStringOption((option) =>
          option.setName("p12").setDescription("player 12"),
        )
        .addStringOption((option) =>
          option.setName("p13").setDescription("player 13"),
        )
        .addStringOption((option) =>
          option.setName("p14").setDescription("player 14"),
        )
        .addStringOption((option) =>
          option.setName("p15").setDescription("player 15"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("matchup")
        .setDescription("backfill a matchup")
        .addNumberOption((option) =>
          option.setName("season").setDescription("season").setRequired(true),
        )
        .addNumberOption((option) =>
          option.setName("week").setDescription("week").setRequired(true),
        )
        .addNumberOption((option) =>
          option.setName("order").setDescription("order").setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName("left_team")
            .setDescription("left team")
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName("right_team")
            .setDescription("right team")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lineup")
        .setDescription("backfill a lineup")
        .addNumberOption((option) =>
          option.setName("season").setDescription("season").setRequired(true),
        )
        .addNumberOption((option) =>
          option.setName("week").setDescription("week").setRequired(true),
        )
        .addRoleOption((option) =>
          option.setName("team").setDescription("team").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("slot1")
            .setDescription("Player in slot 1")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("slot2")
            .setDescription("Player in slot 2")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("slot3")
            .setDescription("Player in slot 3")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("slot4").setDescription("Player in slot 4"),
        )
        .addStringOption((option) =>
          option.setName("slot5").setDescription("Player in slot 5"),
        )
        .addStringOption((option) =>
          option.setName("slot6").setDescription("Player in slot 6"),
        )
        .addStringOption((option) =>
          option.setName("slot7").setDescription("Player in slot 7"),
        )
        .addStringOption((option) =>
          option.setName("slot8").setDescription("Player in slot 8"),
        )
        .addStringOption((option) =>
          option.setName("slot9").setDescription("Player in slot 9"),
        )
        .addStringOption((option) =>
          option.setName("slot10").setDescription("Player in slot 10"),
        )
        .addStringOption((option) =>
          option.setName("slot11").setDescription("Player in slot 11"),
        )
        .addStringOption((option) =>
          option.setName("slot12").setDescription("Player in slot 12"),
        )
        .addStringOption((option) =>
          option.setName("slot13").setDescription("Player in slot 13"),
        )
        .addStringOption((option) =>
          option.setName("slot14").setDescription("Player in slot 14"),
        )
        .addStringOption((option) =>
          option.setName("slot15").setDescription("Player in slot 15"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("result")
        .setDescription("backfill a match result")
        .addNumberOption((option) =>
          option.setName("season").setDescription("season").setRequired(true),
        )
        .addNumberOption((option) =>
          option.setName("week").setDescription("week").setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("winner")
            .setDescription("winner (or either player if dead)")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option.setName("game1").setDescription("replay link for g1"),
        )
        .addStringOption((option) =>
          option.setName("game2").setDescription("replay link for g2"),
        )
        .addStringOption((option) =>
          option.setName("game3").setDescription("replay link for g3"),
        )
        .addStringOption((option) =>
          option.setName("game4").setDescription("replay link for the rare g4"),
        )
        .addStringOption((option) =>
          option.setName("game5").setDescription("replay link for g5"),
        )
        .addBooleanOption((option) =>
          option.setName("act").setDescription("true if act"),
        )
        .addBooleanOption((option) =>
          option.setName("dead").setDescription("true if dead"),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("stats")
        .setDescription("Run to re-calculate stats from scratch for a season")
        .addNumberOption((option) =>
          option.setName("season").setDescription("season").setRequired(true),
        ),
    ),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case "team":
        await backfillTeam(interaction);
        break;
      case "season":
        await backfillSeason(interaction);
        break;
      case "player":
        await backfillPlayer(interaction);
        break;
      case "roster":
        await backfillRoster(interaction);
        break;
      case "matchup":
        await backfillMatchup(interaction);
        break;
      case "lineup":
        await backfillLineup(interaction);
        break;
      case "result":
        await backfillResult(interaction);
        break;
      case "stats":
        await rerunStats(interaction);
        break;
    }
  },
};

async function backfillTeam(interaction) {
  if (!userIsBackfiller(interaction.member) && !userIsMod(interaction.member)) {
    return;
  }

  addTeam(interaction);
}

async function backfillSeason(interaction) {
  async function dataCollector(interaction) {
    if (
      !userIsBackfiller(interaction.member) &&
      !userIsMod(interaction.member)
    ) {
      return {
        failure: "You must be a backfiller or mod to use this command.",
      };
    }

    const season = interaction.options.getNumber("season");
    const numWeeks = interaction.options.getNumber("num_weeks");
    const playoffSize = interaction.options.getNumber("playoff_size");
    const teamSnowflakes = [
      interaction.options.getRole("team1"),
      interaction.options.getRole("team2"),
      interaction.options.getRole("team3"),
      interaction.options.getRole("team4"),
      interaction.options.getRole("team5"),
      interaction.options.getRole("team6"),
      interaction.options.getRole("team7"),
      interaction.options.getRole("team8"),
      interaction.options.getRole("team9"),
      interaction.options.getRole("team10"),
      interaction.options.getRole("team11"),
      interaction.options.getRole("team12"),
      interaction.options.getRole("team13"),
      interaction.options.getRole("team14"),
    ]
      .filter((team) => !!team)
      .map((team) => team.id);

    return {
      season,
      numWeeks,
      playoffSize,
      teamSnowflakes,
    };
  }

  function verifier(data) {
    const { season, week, leftTeamSnowflake, rightTeamSnowflake } = data;
    let failures = [],
      prompts = [];

    const confirmLabel = "Confirm matchup submission";
    const confirmMessage = `matchup submitted between ${roleMention(leftTeamSnowflake)} and ${roleMention(rightTeamSnowflake)} in season ${season} week ${week}.`;
    const cancelMessage = "No lineup submitted.";

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    const { season, numWeeks, playoffSize, teamSnowflakes } = data;

    const totalWeeks = numWeeks + Math.ceil(Math.log2(playoffSize));

    await saveBackfillSeason(season, numWeeks, playoffSize);
    await saveNewWeeks(totalWeeks, season);
    await saveBackfillStandings(season, teamSnowflakes);
  }

  await baseHandler(
    interaction,
    dataCollector,
    passThroughVerifier,
    onConfirm,
    true,
    true,
  );
}

async function backfillPlayer(interaction) {
  async function dataCollector(interaction) {
    if (
      !userIsBackfiller(interaction.member) &&
      !userIsMod(interaction.member)
    ) {
      return {
        failure: "You must be a backfiller or mod to use this command.",
      };
    }

    const season = interaction.options.getNumber("season");
    const teamSnowflake = interaction.options.getRole("team").id;
    const playerName = interaction.options.getString("user");
    const roleSnowflake = interaction.options.getRole("role").id;
    const droppedWeek = interaction.options.getNumber("dropped_week");
    const pickedUpWeek = interaction.options.getNumber("picked_up_week");
    const stars = interaction.options.getNumber("stars");

    const teamId = (await loadTeamFromSnowflake(teamSnowflake))?.id;
    const roleId = (await loadRoleFromSnowflake(roleSnowflake))?.id;
    const playerId = (await loadPlayerFromUsername(playerName))?.id;
    const rosterSpotId = (await loadPlayerOnRoster(season, playerId))?.id;

    return {
      season,
      teamId,
      playerName,
      roleId,
      droppedWeek,
      pickedUpWeek,
      stars,
      playerId,
      rosterSpotId,
    };
  }

  function verifier(data) {
    const { season, playerName, playerId, rosterSpotId, teamId } = data;
    let failures = [],
      prompts = [];

    if (teamId === undefined) {
      failures.push("Didn't find input team.");
    }

    if (!playerId) {
      prompts.push(
        `${playerName} not found. Will create a new player record for them.`,
      );
    }

    if (!!rosterSpotId) {
      prompts.push(
        `Already found ${playerName} on a roster in season ${season}. Are you sure?`,
      );
    }

    const confirmLabel = "Confirm player data";
    const confirmMessage = `Roster updated for ${playerName} in season ${season}.`;
    const cancelMessage = "No update.";

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    let {
      season,
      teamId,
      playerName,
      roleId,
      droppedWeek,
      pickedUpWeek,
      stars,
      playerId,
    } = data;

    if (!playerId) {
      await saveNewPlayer(undefined, playerName, undefined);
      playerId = await loadPlayerFromUsername(playerName);
    }

    await saveBackfillPlayer(
      season,
      teamId,
      roleId,
      playerId,
      stars,
      pickedUpWeek,
      droppedWeek,
    );
  }

  await baseHandler(
    interaction,
    dataCollector,
    verifier,
    onConfirm,
    true,
    false,
  );
}

async function backfillRoster(interaction) {
  async function dataCollector(interaction) {
    if (
      !userIsBackfiller(interaction.member) &&
      !userIsMod(interaction.member)
    ) {
      return {
        failure: "You must be a backfiller or mod to use this command.",
      };
    }

    const season = interaction.options.getNumber("season");
    const teamSnowflake = interaction.options.getRole("team").id;
    const captainOptions = [
      interaction.options.getString("cap1"),
      interaction.options.getString("cap2"),
    ].filter((captain) => !!captain);
    const [captains, captainStars] = captainOptions.reduce(
      (accum, item) => [
        accum[0].concat([item.split("\\")[0]]),
        accum[1].concat([item.split("\\")[1]]),
      ],
      [[], []],
    );
    const coach = interaction.options.getString("coach");
    const playerOptions = [
      interaction.options.getString("p1"),
      interaction.options.getString("p2"),
      interaction.options.getString("p3"),
      interaction.options.getString("p4"),
      interaction.options.getString("p5"),
      interaction.options.getString("p6"),
      interaction.options.getString("p7"),
      interaction.options.getString("p8"),
      interaction.options.getString("p9"),
      interaction.options.getString("p10"),
      interaction.options.getString("p11"),
      interaction.options.getString("p12"),
      interaction.options.getString("p13"),
      interaction.options.getString("p14"),
      interaction.options.getString("p15"),
    ].filter((member) => !!member);
    const [players, playerStars] = playerOptions.reduce(
      (accum, item) => [
        accum[0].concat([item.split("\\")[0]]),
        accum[1].concat([item.split("\\")[1]]),
      ],
      [[], []],
    );

    const { id: teamId } = await loadTeamFromSnowflake(teamSnowflake);
    const { alreadyFull } = await loadExistingRoster(season, teamSnowflake);

    const captainIds = await Promise.all(
      captains.map(
        async (captain) => (await loadPlayerFromUsername(captain))?.id,
      ),
    );
    const coachId = coach
      ? (await loadPlayerFromUsername(coach))?.id
      : undefined;
    const playerIds = await Promise.all(
      players.map(async (player) => (await loadPlayerFromUsername(player))?.id),
    );

    const notFoundPlayers = [
      ...captains.filter((_, i) => !captainIds[i]),
      ...(coach && !coachId ? [coach] : []),
      ...players.filter((_, i) => !playerIds[i]),
    ];

    return {
      season,
      teamSnowflake,
      teamId,
      alreadyFull,
      notFoundPlayers,
      captains,
      captainIds,
      captainStars,
      coach,
      coachId,
      players,
      playerIds,
      playerStars,
    };
  }

  function verifier(data) {
    const { season, teamSnowflake, alreadyFull, notFoundPlayers } = data;
    let failures = [],
      prompts = [];

    if (alreadyFull) {
      prompts.push(
        `There is already a roster for ${roleMention(teamSnowflake)} in season ${season}. Are you sure?`,
      );
    }

    if (notFoundPlayers.length > 0) {
      prompts.push(
        `Will add the following players to the db: ${notFoundPlayers.join(", ")}.`,
      );
    }

    const confirmLabel = "Confirm roster submission";
    const confirmMessage = `Roster submitted for ${roleMention(teamSnowflake)} in season ${season}.`;
    const cancelMessage = "No roster submitted.";

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    let {
      season,
      teamId,
      captains,
      captainIds,
      captainStars,
      coach,
      coachId,
      players,
      playerIds,
      playerStars,
    } = data;

    for (const i in captains) {
      if (!captainIds[i]) {
        await saveNewPlayer(undefined, captains[i], undefined);
        captainIds[i] = await loadPlayerFromUsername(captains[i]);
      }
    }

    if (coach && !coachId) {
      await saveNewPlayer(undefined, coach, undefined);
      coachId = await loadPlayerFromUsername(coach);
    }

    for (const i in players) {
      if (!playerIds[i]) {
        await saveNewPlayer(undefined, players[i], undefined);
        playerIds[i] = await loadPlayerFromUsername(players[i]);
      }
    }

    await saveBackfillRoster(
      season,
      teamId,
      playerIds,
      playerStars,
      captainIds,
      captainStars,
      coachId,
    );
  }

  await baseHandler(
    interaction,
    dataCollector,
    verifier,
    onConfirm,
    true,
    true,
  );
}

async function backfillMatchup(interaction) {
  async function dataCollector(interaction) {
    if (
      !userIsBackfiller(interaction.member) &&
      !userIsMod(interaction.member)
    ) {
      return {
        failure: "You must be a backfiller or mod to use this command.",
      };
    }

    const season = interaction.options.getNumber("season");
    const week = interaction.options.getNumber("week");
    const order = interaction.options.getNumber("order");
    const leftTeamSnowflake = interaction.options.getRole("left_team").id;
    const rightTeamSnowflake = interaction.options.getRole("right_team").id;
    const leftTeamId = (await loadTeamFromSnowflake(leftTeamSnowflake)).id;
    const rightTeamId = (await loadTeamFromSnowflake(rightTeamSnowflake)).id;

    return {
      season,
      week,
      order,
      leftTeamSnowflake,
      rightTeamSnowflake,
      leftTeamId,
      rightTeamId,
    };
  }

  function verifier(data) {
    const { season, week, leftTeamSnowflake, rightTeamSnowflake } = data;
    let failures = [],
      prompts = [];

    const confirmLabel = "Confirm matchup submission";
    const confirmMessage = `matchup submitted between ${roleMention(leftTeamSnowflake)} and ${roleMention(rightTeamSnowflake)} in season ${season} week ${week}.`;
    const cancelMessage = "No lineup submitted.";

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    const { season, week, order, leftTeamId, rightTeamId } = data;

    await saveOneNewMatchup(order, leftTeamId, rightTeamId, season, week);
  }

  await baseHandler(
    interaction,
    dataCollector,
    verifier,
    onConfirm,
    true,
    false,
  );
}

async function backfillLineup(interaction) {
  async function dataCollector(interaction) {
    if (
      !userIsBackfiller(interaction.member) &&
      !userIsMod(interaction.member)
    ) {
      return {
        failure: "You must be a backfiller or mod to use this command.",
      };
    }

    const season = interaction.options.getNumber("season");
    const week = interaction.options.getNumber("week");
    const teamSnowflake = interaction.options.getRole("team").id;
    const lineupOption = [
      interaction.options.getString("slot1"),
      interaction.options.getString("slot2"),
      interaction.options.getString("slot3"),
      interaction.options.getString("slot4"),
      interaction.options.getString("slot5"),
      interaction.options.getString("slot6"),
      interaction.options.getString("slot7"),
      interaction.options.getString("slot8"),
      interaction.options.getString("slot9"),
      interaction.options.getString("slot10"),
      interaction.options.getString("slot11"),
      interaction.options.getString("slot12"),
      interaction.options.getString("slot13"),
      interaction.options.getString("slot14"),
      interaction.options.getString("slot15"),
    ].filter((member) => !!member);

    const submitter = await loadPlayerFromSnowflake(interaction.user.id);

    const matchup = await loadMatchupForTeam(season, week, teamSnowflake);

    const roster = await loadRoster(season, teamSnowflake);

    const lineup = lineupOption.map((player) =>
      roster.find((p) => p.name === player),
    );

    const { alreadyFull } = await loadExistingPairingForMatchup(
      matchup.id,
      roster[0].teamId,
    );

    return {
      season,
      week,
      submitter,
      teamSnowflake,
      matchup,
      lineup,
      roster,
      alreadyFull,
    };
  }

  function verifier(data) {
    const { season, week, teamSnowflake, lineup, alreadyFull } = data;
    let failures = [],
      prompts = [];

    if (alreadyFull) {
      prompts.push(
        `There is already a lineup for ${roleMention(teamSnowflake)} in season ${season} week ${week}. Are you sure?`,
      );
    }

    const confirmLabel = "Confirm lineup submission";
    const confirmMessage =
      `Lineup submitted for ${roleMention(teamSnowflake)} in season ${season} week ${week}.\n`.concat(
        lineup.map((player) => player.name).join("\n"),
      );
    const cancelMessage = "No lineup submitted.";

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    const { submitter, matchup, lineup } = data;

    const side =
      matchup.left_team === matchup.submittingTeamId ? "left" : "right";

    await saveMatchupSubmission(
      matchup.id,
      0,
      lineup.length,
      side,
      submitter.id,
    );
    await saveLineupSubmission(matchup.id, side, lineup);
  }

  await baseHandler(
    interaction,
    dataCollector,
    verifier,
    onConfirm,
    true,
    true,
  );
}

async function backfillResult(interaction) {
  async function dataCollector(interaction) {
    if (
      !userIsBackfiller(interaction.member) &&
      !userIsMod(interaction.member)
    ) {
      return {
        failure: "You must be a backfiller or mod to use this command.",
      };
    }

    const season = interaction.options.getNumber("season");
    const week = interaction.options.getNumber("week");
    const winner = interaction.options.getString("winner");
    const games = [
      interaction.options.getString("game1"),
      interaction.options.getString("game2"),
      interaction.options.getString("game3"),
      interaction.options.getString("game4"),
      interaction.options.getString("game5"),
    ].filter((game) => !!game);
    const act = interaction.options.getBoolean("act");
    const dead = interaction.options.getBoolean("dead");

    const player = await loadPlayerFromUsername(winner);

    const pairing = await loadOnePairing(
      season,
      week,
      player.discord_snowflake,
    );

    if (!pairing) {
      return {
        failure: `No pairing found for ${winner}. Is this a Mushi League match?`,
      };
    }

    const winnerOnLeft = pairing.leftPlayerName === winner;

    return { games, season, week, pairing, winnerOnLeft, act, dead };
  }

  function verifier(data) {
    const { games, pairing, winnerOnLeft, season, week } = data;
    let failures = [],
      prompts = [];

    if (pairing.winner || pairing.dead) {
      prompts.push(
        `${userMention(pairing.leftPlayerSnowflake)} vs ${userMention(
          pairing.rightPlayerSnowflake,
        )} already has a result reported. Are you sure?`,
      );
    }

    for (let i = 0; i < games.length; i++) {
      if (
        games[i].startsWith("http") &&
        games.some((game, j) => j !== i && game === games[i])
      ) {
        failures.push("You seem to have linked the same game multiple times.");
      }
    }

    if (games.some((game) => game.search("battle") !== -1)) {
      failures.push(
        "You seem to have given live game links instead of replay links.",
      );
    }

    const winnerSnowflake = winnerOnLeft
      ? pairing.leftPlayerSnowflake
      : pairing.rightPlayerSnowflake;
    const loserSnowflake = winnerOnLeft
      ? pairing.rightPlayerSnowflake
      : pairing.leftPlayerSnowflake;

    const confirmLabel = "Confirm match report";
    const confirmMessage = `${userMention(
      winnerSnowflake,
    )} defeated ${userMention(loserSnowflake)} in slot ${pairing.slot} season ${season} week ${week}.`;
    const cancelMessage = "No match reported.";

    return [failures, prompts, confirmLabel, confirmMessage, cancelMessage];
  }

  async function onConfirm(data) {
    const { games, dead, pairing, winnerOnLeft } = data;

    const winnerId = winnerOnLeft
      ? pairing.leftPlayerId
      : pairing.rightPlayerId;
    await savePairingResult(
      pairing.id,
      games,
      dead ? null : winnerId,
      dead ? dead : null,
    );
  }

  await baseHandler(
    interaction,
    dataCollector,
    verifier,
    onConfirm,
    true,
    false,
  );
}

async function rerunStats(interaction) {
  async function dataCollector(interaction) {
    if (
      !userIsBackfiller(interaction.member) &&
      !userIsMod(interaction.member)
    ) {
      return {
        failure: "You must be a backfiller or mod to use this command.",
      };
    }

    const season = interaction.options.getNumber("season");

    return { season };
  }

  async function onConfirm(data) {
    const { season } = data;
    await saveRecalculateStandings(season);
    await saveRecalculatePstats(season);
  }

  await baseHandler(
    interaction,
    dataCollector,
    passThroughVerifier,
    onConfirm,
    true,
    false,
  );
}
