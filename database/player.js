import { db } from "./database.js";

export async function saveDropAllPlayers() {
  await db.run(
    "UPDATE player SET active = false, retain_rights = team, team = NULL, role = NULL",
  );
}

export async function saveStarPointsToRatings(season) {
  await db.run(
    "UPDATE player SET stars = MAX(MIN(player.stars + (pstat.star_points / 100.0), 5), 1) \
                  FROM pstat WHERE pstat.player = player.id AND pstat.season = ?",
    season,
  );
}

export async function saveNewPlayer(snowflake, name, stars) {
  await db.run(
    `INSERT INTO player (name, discord_snowflake, stars) VALUES (?, ?, ?)`,
    name,
    snowflake,
    stars,
  );
}

export async function savePlayerChange(
  id,
  name,
  stars,
  team,
  role,
  active,
  season,
  currentWeek,
) {
  let updatePlayerQuery = `UPDATE player SET name = '${name}', stars = ${stars}, team = ${
    team ?? null
  }, role = ${role ?? null}, active = ${active} WHERE id = ${id};`;

  if (active) {
    const pickedUpWeek =
      team == null || currentWeek === 0 ? null : currentWeek + 1;
    const droppedWeek = team != null || currentWeek === 0 ? null : currentWeek;
    const isDraftNotStartedYetSubquery = `SELECT count(id) = 0 FROM draft WHERE season = ${season}`;
    updatePlayerQuery += `INSERT INTO roster (season, player, team, role, retained, picked_up_week, dropped_week)
       VALUES (${season}, ${id}, ${team}, ${role}, (${isDraftNotStartedYetSubquery}), ${pickedUpWeek}, ${droppedWeek}) ON CONFLICT DO UPDATE SET team = ${team}, role = ${role};`;
  } else {
    updatePlayerQuery += `DELETE FROM roster WHERE season = ${season} AND player = ${id};`;
  }

  if (role === 1 || role === 2 && active) {
    updatePlayerQuery += `INSERT INTO pstat (player, season, stars) VALUES (${id}, ${season}, ${stars}) ON CONFLICT DO UPDATE SET stars = ${stars};`;
  }

  await db.exec(updatePlayerQuery);
}

export async function loadAllActivePlayers() {
  return await db.all("SELECT discord_snowflake FROM player WHERE active = 1");
}

export async function loadAllPlayersOnTeam(teamId) {
  return await db.all(
    "SELECT discord_snowflake FROM player WHERE player.team = ?",
    teamId,
  );
}

export async function loadPlayerFromSnowflake(playerSnowflake) {
  const query =
    "SELECT player.id, player.name, player.stars, player.active, player.discord_snowflake, \
                role.id AS roleId, role.discord_snowflake AS roleSnowflake, role.name AS roleName, team.id AS teamId, team.discord_snowflake AS teamSnowflake FROM player \
         LEFT JOIN team ON team.id = player.team \
         LEFT JOIN role ON role.id = player.role \
         WHERE player.discord_snowflake = ?";

  return await db.get(query, playerSnowflake);
}

export async function loadPlayerFromUsername(playerName) {
  const query =
    "SELECT player.id, player.name, player.stars, player.active, player.discord_snowflake, \
                role.id AS roleId, role.discord_snowflake AS roleSnowflake, role.name AS roleName, team.id AS teamId, team.discord_snowflake AS teamSnowflake FROM player \
         LEFT JOIN team ON team.id = player.team \
         LEFT JOIN role ON role.id = player.role \
         WHERE player.name = ?";

  return await db.get(query, playerName);
}

export async function loadExistingLeader(teamSnowflake, roleSnowflake) {
  const query =
    "SELECT player.discord_snowflake FROM player \
         INNER JOIN team ON team.id = player.team \
         INNER JOIN role ON role.id = player.role \
         WHERE team.discord_snowflake = ? AND role.discord_snowflake = ?";

  return await db.get(query, teamSnowflake, roleSnowflake);
}

export async function loadTeamInStarOrder(teamSnowflake) {
  const query =
    "SELECT player.id, player.name, player.discord_snowflake, player.stars, team.discord_snowflake AS teamSnowflake, role.name AS roleName FROM player \
         INNER JOIN team ON player.team = team.id \
         INNER JOIN role ON player.role = role.id \
         WHERE team.discord_snowflake = ? \
         ORDER BY stars DESC";
  return await db.all(query, teamSnowflake);
}

export async function loadPlayersOnTeamInStarOrder(teamId) {
  return await db.all(
    "SELECT id FROM player WHERE team = ? AND role != 3 ORDER BY stars DESC",
    teamId,
  );
}

export async function loadRosterSize(teamId, captainOnly) {
  if (captainOnly) {
    return await db.get(
      "SELECT 1 AS size, stars FROM player WHERE team = ? AND role = 2 ORDER BY stars DESC LIMIT 1",
      teamId,
    );
  } else
    return await db.get(
      "SELECT COUNT(stars) AS size, SUM(stars) AS stars FROM player WHERE team = ? AND role != 3",
      teamId,
    );
}

export async function loadUndraftedPlayers(maxStars) {
  return await db.all(
    "SELECT name, stars, discord_snowflake FROM player WHERE team IS NULL AND active = 1 AND stars <= ? ORDER BY stars DESC, LOWER(name) ASC",
    maxStars,
  );
}

export async function loadPlayersForSubstitution(
  season,
  week,
  replacedPlayerSnowflake,
  newPlayerSnowflake,
) {
  const query =
    'SELECT player.id, player.stars, player.name, player.discord_snowflake, team.discord_snowflake AS teamSnowflake, role.name AS roleName, \
                pairing.slot, IIF(pairing.left_player = player.id, "left", "right") AS side, pairing.winner, pairing.dead, pairing.predictions_message FROM player \
         LEFT JOIN( \
             SELECT * FROM pairing \
	         INNER JOIN matchup ON matchup.id = pairing.matchup \
	         INNER JOIN week ON week.id = matchup.week \
	         WHERE week.season = ? AND week.number = ? \
         ) AS pairing ON pairing.left_player = player.id OR pairing.right_player = player.id \
         INNER JOIN team ON team.id = player.team \
         INNER JOIN role ON role.id = player.role \
         WHERE player.discord_snowflake = ? OR player.discord_snowflake = ?';

  return await db.all(
    query,
    season,
    week,
    replacedPlayerSnowflake,
    newPlayerSnowflake,
  );
}

export async function getSeasonSize() {
  const query =
    "SELECT count(id) AS playerCount, sum(stars) AS starCount FROM player WHERE active = 1 AND role IS NULL OR role != 3";

  return await db.get(query);
}

export async function loadPlayerHistory(playerId) {
  const playerInfoQuery =
    "SELECT player.name AS playerName, roster.season, roster.picked_up_week, roster.dropped_week, role.name AS roleName, pstat.stars, pstat.wins, pstat.act_wins, pstat.losses, pstat.act_losses, pstat.ties, pstat.star_points, team.id AS teamId, team.name AS teamName, team.color \
     FROM player \
     INNER JOIN roster ON roster.player = player.id \
     LEFT JOIN pstat ON pstat.player = player.id AND pstat.season = roster.season \
     INNER JOIN team ON team.id = roster.team \
     INNER JOIN role ON role.id = roster.role \
     WHERE player.id = ? \
     ORDER BY roster.season DESC";

  const pairingQuery =
    "SELECT slot, game1, game2, game3, game4, game5, pairing.winner, dead, week.season, week.number as weekNumber, season.regular_weeks, season.playoff_size, opponent.id AS opponentId, opponent.name AS opponentName, opponentPstat.stars AS opponentStars, opponentTeam.name AS opponentTeam, opponentTeam.color AS opponentTeamColor \
     FROM pairing \
     INNER JOIN matchup ON pairing.matchup = matchup.id \
     INNER JOIN week ON matchup.week = week.id \
     INNER JOIN season ON season.number = week.season \
     INNER JOIN player AS opponent ON opponent.id = IIF(pairing.left_player = ?, pairing.right_player, pairing.left_player) \
     INNER JOIN pstat AS opponentPstat ON opponentPstat.player = opponent.id AND opponentPstat.season = week.season \
     INNER JOIN team AS opponentTeam ON opponentTeam.id = IIF(pairing.left_player = ?, matchup.right_team, matchup.left_team) \
     WHERE (pairing.left_player = ? OR pairing.right_player = ?) \
       AND (season.number < (SELECT number FROM season ORDER BY number DESC LIMIT 1) OR week.number <= (SELECT current_week FROM season ORDER BY number DESC LIMIT 1)) \
     ORDER BY week.season DESC, week.number DESC";

  const [playerInfo, pairings] = await Promise.all([
    db.all(playerInfoQuery, playerId),
    db.all(pairingQuery, playerId, playerId, playerId, playerId),
  ]);

  return { playerInfo, pairings };
}

export async function loadAllPlayersEver() {
  const query =
    "SELECT player.id, player.name, player.stars, MAX(roster.season) as most_recent_season, COUNT(season.number) as season_wins, COUNT(roster.player) AS total_seasons,\
     SUM(pstat.wins + pstat.act_wins + pstat.losses + pstat.act_losses + pstat.ties) AS total_games, \
     ROUND(SUM(pstat.wins + pstat.act_wins * 1.0) / SUM (pstat.wins + pstat.act_wins + pstat.losses + pstat.act_losses), 3) AS win_rate,\
     SUM(pstat.wins) as wins, SUM(pstat.act_wins) as act_wins, SUM(pstat.losses) as losses, SUM(pstat.act_losses) as act_losses, SUM(pstat.ties) AS ties\
     FROM player\
     INNER JOIN roster ON roster.player = player.id \
     LEFT JOIN pstat ON pstat.player = player.id AND roster.season = pstat.season\
  	 LEFT JOIN season ON season.winner = roster.team AND season.number = roster.season\
     GROUP BY player.id\
     ORDER BY SUM(wins + act_wins) DESC, total_seasons DESC, total_games DESC, most_recent_season DESC";

  return await db.all(query);
}
