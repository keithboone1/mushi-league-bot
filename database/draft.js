import { db } from "./database.js";

export async function loadNextPickTeam(season) {
  const query =
    "SELECT draft.id AS draftId, round, team.id AS teamId, team.discord_snowflake FROM draft \
         INNER JOIN team ON team.id = draft.team \
         WHERE pick IS NULL AND skipped IS NULL AND season = ? \
         ORDER BY season ASC, round ASC, pick_order ASC";

  return await db.get(query, season);
}

export async function loadNextPickRoundForTeam(teamId, season) {
  return await db.get(
    "SELECT round FROM draft WHERE pick IS NULL AND skipped IS NULL AND team = ? AND season = ?",
    teamId,
    season
  );
}

export async function loadDraft(season) {
  const picksQuery =
    "SELECT draft.round, draft.pick_order, team.id AS teamId, team.name AS teamName, team.color, player.id AS playerId, player.name AS playerName, pstat.stars FROM draft \
     LEFT JOIN player ON player.id = draft.pick \
     INNER JOIN team ON team.id = draft.team \
     LEFT JOIN pstat ON pstat.player = draft.pick AND pstat.season = draft.season \
     WHERE draft.season = ? \
     ORDER BY draft.round ASC, draft.pick_order ASC";

  const captainsQuery =
    "SELECT team.id AS teamId, team.name AS teamName, team.color, player.id AS playerId, player.name AS playerName, pstat.stars FROM roster \
     INNER JOIN player ON player.id = roster.player \
     INNER JOIN team ON team.id = roster.team \
     INNER JOIN pstat ON pstat.player = player.id AND pstat.season = roster.season \
     WHERE roster.season = ? AND roster.role = 2 \
     ORDER BY pstat.stars DESC";

  const retainsQuery =
    "SELECT team.id AS teamId, team.name AS teamName, team.color, player.id AS playerId, player.name AS playerName, pstat.stars FROM roster \
     INNER JOIN player ON player.id = roster.player \
     INNER JOIN team ON team.id = roster.team \
     INNER JOIN pstat ON pstat.player = player.id AND pstat.season = roster.season \
     WHERE roster.season = ? AND roster.role = 1 AND roster.retained = 1 \
     ORDER BY pstat.stars DESC";

  const picks = await db.all(picksQuery, season);
  const retains = await db.all(retainsQuery, season);
  const captains = await db.all(captainsQuery, season);

  return { captains, retains, picks };
}

export async function saveDraftSetup(
  season,
  maxRoster,
  limitedRoundOrder,
  normalOrder
) {
  let query = "INSERT INTO draft (season, round, pick_order, team) VALUES";

  for (let round = 1; round <= maxRoster; round++) {
    for (let order = 1; order <= normalOrder.length; order++) {
      const team =
        round === 1
          ? limitedRoundOrder[order - 1]
          : round % 2 === 0
          ? normalOrder[order - 1]
          : normalOrder[normalOrder.length - order];

      query += `\n(${season}, ${round}, ${order}, ${team})`;

      if (round < maxRoster || order < normalOrder.length) {
        query += ",";
      }
    }
  }

  await db.run(query);
}

export async function saveDraftPick(draftId, playerId) {
  await db.run("UPDATE draft SET pick = ? WHERE id = ?", playerId, draftId);
}

export async function saveWithdrawTeam(teamId) {
  await db.run(
    "update draft SET skipped = 1 WHERE team = ? AND pick IS NULL",
    teamId
  );
}
