import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  roleMention,
  userMention,
  bold,
  codeBlock,
} from "discord.js";
import { channels, currentSeason, mushiLeagueGuild } from "../globals.js";
import { loadTeam } from "../../database/team.js";
import {
  loadAllPlayersOnTeam,
  loadPlayerFromUsername,
} from "../../database/player.js";
import {
  postPredictionStandings,
  updatePrediction,
  changePredictionsPlayer,
  postPredictions,
} from "../features/predictions.js";
import { loadStandings } from "../../database/standing.js";
import {
  setScheduledTime,
  changeScheduledPlayer,
  postScheduling,
} from "../features/schedule.js";
import { saveDraftSetup } from "../../database/draft.js";
import {
  addModOverrideableFailure,
  fixFloat,
  userIsCaptain,
  userIsCoach,
  userIsMod,
  weekName,
  baseFunctionlessHandler,
  baseHandler,
  userIsBackfiller,
} from "./util.js";
import {
  loadPlayerFromSnowflake,
  loadTeamInStarOrder,
  loadPlayersForSubstitution,
} from "../../database/player.js";
import {
  loadOneLineup,
  saveSubstitution,
  loadOnePairing,
  savePairingResult,
  saveLineupSubmission,
} from "../../database/pairing.js";
import {
  loadMatchupsMissingLineups,
  loadMatchupForTeam,
  saveMatchupSubmission,
  loadExistingPairingForMatchup,
} from "../../database/matchup.js";

export const BACKFILL_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("backfill")
    .setDescription("backfill bot data for previous seasons DO NOT USE WITHOUT ASKING")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("lineup")
        .setDescription(
          "Submits a complete lineup before the week has been posted",
        )
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
          option
            .setName("slot4")
            .setDescription("Player in slot 4")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("slot5")
            .setDescription("Player in slot 5")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("slot6")
            .setDescription("Player in slot 6")
            .setRequired(true),
        )
        .addStringOption((option) =>
          option
            .setName("slot7")
            .setDescription("Player in slot 7")
            .setRequired(true),
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
    ),

  async execute(interaction) {
    switch (interaction.options.getSubcommand()) {
      case "lineup":
        await backfillLineup(interaction);
        break;
      case "result":
        await backfillResult(interaction);
        break;
    }
  },
};

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
    const teamOption = interaction.options.getRole("team").id;
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

    const matchup = await loadMatchupForTeam(season, week, teamOption);

    const roster = await loadTeamInStarOrder(teamSnowflake);

    const lineup = lineupOption.map((player) =>
      roster.find((p) => p.name === player),
    );

    const alreadyFull = !!(await loadExistingPairingForMatchup(
      matchup.id,
      roster.teamId,
    ));

    return {
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
        lineup
          .map((player) => userMention(player.discord_snowflake))
          .join("\n"),
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
