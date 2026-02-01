import { db } from "./database.js";

export async function saveBackfillPlayer(
  season,
  teamId,
  roleId,
  playerId,
  stars,
  pickedUpWeek,
  droppedWeek,
) {
  const updatePstatQuery = `INSERT INTO pstat (season, player, stars) VALUES (?, ?, ?) ON CONFLICT DO UPDATE SET stars = EXCLUDED.stars;`;

  const updateRosterQuery = `INSERT INTO roster (season, player, team, role, picked_up_week, dropped_week) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO UPDATE SET role = EXCLUDED.role, picked_up_week = EXCLUDED.picked_up_week, dropped_week = EXCLUDED.dropped_week;`;

  await db.run(updatePstatQuery, season, playerId, stars);
  await db.run(
    updateRosterQuery,
    season,
    playerId,
    teamId,
    roleId,
    pickedUpWeek,
    droppedWeek,
  );
}

export async function saveBackfillRoster(
  season,
  teamId,
  players,
  playerStars,
  captains,
  captainStars,
  coach,
) {
  const pstatValues = [
    ...captains.map(
      (captain, index) => `(${season}, ${captain}, ${captainStars[index]})`,
    ),
    ...players.map(
      (player, index) => `(${season}, ${player}, ${playerStars[index]})`,
    ),
  ].join(",\n");

  const updatePstatQuery = `INSERT INTO pstat (season, player, stars) VALUES\n${pstatValues}\nON CONFLICT DO UPDATE SET stars = EXCLUDED.stars;`;

  const rosterValues = [
    ...captains.map((captain) => `(${season}, ${captain}, ${teamId}, 2)`),
    ...players.map((player) => `(${season}, ${player}, ${teamId}, 1)`),
    ...(coach ? [`\n(${season}, ${coach}, ${teamId}, 3)`] : []),
  ].join(",\n");

  const updateRosterQuery = `INSERT INTO roster (season, player, team, role) VALUES\n${rosterValues}\nON CONFLICT DO UPDATE SET role = EXCLUDED.role;`;

  await db.run(updatePstatQuery);
  await db.run(updateRosterQuery);
}

export async function savePostDraftRosters(season) {
  const query =
    "INSERT INTO roster (season, team, player, role) SELECT ?, team, id, role FROM player WHERE team IS NOT NULL";
  await db.run(query, season);
}

export async function loadAllTeams(season) {
  const query =
    "SELECT DISTINCT team.id, team.name, team.color FROM roster \
     INNER JOIN team ON team.id = roster.team \
     WHERE roster.season = ? \
     ORDER BY team.name ASC";

  return await db.all(query, season);
}

export async function loadExistingRoster(season, teamSnowflake) {
  const query =
    "SELECT count(roster.id) > 0 as alreadyFull from roster\
      join team on team.id = roster.team\
      where season = ? and team.discord_snowflake = ?";

  return await db.get(query, season, teamSnowflake);
}

export async function loadRoster(season, teamSnowflake) {
  const query =
    "SELECT player.id, player.name, player.discord_snowflake, player.stars, team.id as teamId FROM roster \
         INNER JOIN player ON roster.player = player.id \
         INNER JOIN team ON roster.team = team.id \
         WHERE roster.season = ? AND team.discord_snowflake = ?";

  return await db.all(query, season, teamSnowflake);
}

export async function loadPlayerOnRoster(season, playerId) {
  const query = "SELECT id FROM roster WHERE season = ? AND player = ?";

  return await db.get(query, season, playerId);
}
