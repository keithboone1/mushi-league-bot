import { db } from "./database.js";

export async function saveInitialStandings(season) {
  await db.run(
    "INSERT INTO standing (season, team) SELECT ?, id FROM team WHERE active = 1",
    season,
  );
}

export async function saveBackfillStandings(season, teamSnowflakes) {
  await db.run(
    `INSERT INTO standing (season, team) SELECT ?, id FROM team WHERE team.discord_snowflake in (${teamSnowflakes.join(", ")})`,
    season,
  );
}

export async function loadStandingWeeksSoFar(season) {
  return await db.get(
    "SELECT wins + losses + ties AS standingsWeeks FROM standing WHERE season = ? LIMIT 1",
    season,
  );
}

export async function loadStandings(season) {
  const query =
    "SELECT team.id AS teamId, team.discord_snowflake AS teamSnowflake, team.name AS teamName, \
                standing.wins, standing.losses, standing.ties, standing.battle_differential, standing.points FROM standing \
         INNER JOIN team ON team.id = standing.team \
         WHERE season = ? \
         ORDER BY standing.points DESC, standing.battle_differential DESC";

  return await db.all(query, season);
}

export async function loadWebStandings(season) {
  const query =
    "SELECT team.id, team.name, team.color, \
              standing.wins, standing.losses, standing.ties, standing.battle_differential, standing.points FROM standing \
       INNER JOIN team ON team.id = standing.team \
       WHERE season = ? \
       ORDER BY standing.points DESC, standing.battle_differential DESC";

  return await db.all(query, season);
}

export async function loadTopTeams(season, number) {
  const query =
    "SELECT team.id AS teamId, team.discord_snowflake AS teamSnowflake, team.name AS teamName FROM standing \
         INNER JOIN team ON team.id = standing.team \
         WHERE season = ? \
         ORDER BY standing.points DESC, standing.battle_differential DESC LIMIT ?";

  return await db.all(query, season, number);
}

export async function saveStandingsUpdate(
  season,
  differential,
  leftTeamId,
  rightTeamId,
) {
  if (differential > 0) {
    await db.run(
      "UPDATE standing SET wins = wins + 1, points = points + 3, battle_differential = battle_differential + ? WHERE season = ? AND team = ?",
      differential,
      season,
      leftTeamId,
    );
    await db.run(
      "UPDATE standing SET losses = losses + 1, battle_differential = battle_differential - ? WHERE season = ? AND team = ?",
      differential,
      season,
      rightTeamId,
    );
  } else if (differential < 0) {
    await db.run(
      "UPDATE standing SET losses = losses + 1, battle_differential = battle_differential + ? WHERE season = ? AND team = ?",
      differential,
      season,
      leftTeamId,
    );
    await db.run(
      "UPDATE standing SET wins = wins + 1, points = points + 3, battle_differential = battle_differential - ? WHERE season = ? AND team = ?",
      differential,
      season,
      rightTeamId,
    );
  } else {
    await db.run(
      "UPDATE standing SET ties = ties + 1, points = points + 1 WHERE season = ? AND (team = ? OR team = ?)",
      season,
      leftTeamId,
      rightTeamId,
    );
  }
}

export async function saveRecalculateStandings(
  season,
) { 
  const query = `-- Update standings based on matchup results
-- This query calculates wins, losses, ties, battle differential, and points for each team
-- Replace :season with the actual season number you want to update

WITH matchup_results AS (
    -- For each matchup, count wins for left and right teams
    SELECT 
        m.id AS matchup_id,
        m.week,
        w.season,
        m.left_team,
        m.right_team,
        -- Count how many times left team's players won
        COUNT(CASE 
            WHEN p.winner = r_left.player THEN 1 
        END) AS left_wins,
        -- Count how many times right team's players won
        COUNT(CASE 
            WHEN p.winner = r_right.player THEN 1 
        END) AS right_wins
    FROM matchup m
    JOIN week w ON m.week = w.id
    JOIN season s ON w.season = s.number
    JOIN pairing p ON p.matchup = m.id
    LEFT JOIN roster r_left ON r_left.player = p.left_player AND r_left.team = m.left_team AND r_left.season = w.season
    LEFT JOIN roster r_right ON r_right.player = p.right_player AND r_right.team = m.right_team AND r_right.season = w.season
    WHERE p.winner IS NOT NULL
      AND w.season = ?  -- Filter for specific season
      AND w.number <= s.regular_weeks  -- Only count regular season matchups
    GROUP BY m.id, m.week, w.season, m.left_team, m.right_team
),
team_results AS (
    -- Calculate W/L/T and battle differential for each team from each matchup
    SELECT 
        season,
        left_team AS team,
        CASE 
            WHEN left_wins > right_wins THEN 1 
            ELSE 0 
        END AS wins,
        CASE 
            WHEN left_wins < right_wins THEN 1 
            ELSE 0 
        END AS losses,
        CASE 
            WHEN left_wins = right_wins THEN 1 
            ELSE 0 
        END AS ties,
        left_wins - right_wins AS battle_differential
    FROM matchup_results
    
    UNION ALL
    
    SELECT 
        season,
        right_team AS team,
        CASE 
            WHEN right_wins > left_wins THEN 1 
            ELSE 0 
        END AS wins,
        CASE 
            WHEN right_wins < left_wins THEN 1 
            ELSE 0 
        END AS losses,
        CASE 
            WHEN right_wins = left_wins THEN 1 
            ELSE 0 
        END AS ties,
        right_wins - left_wins AS battle_differential
    FROM matchup_results
),
aggregated_results AS (
    -- Aggregate all matchup results by team and season
    SELECT 
        season,
        team,
        SUM(wins) AS total_wins,
        SUM(losses) AS total_losses,
        SUM(ties) AS total_ties,
        SUM(battle_differential) AS total_battle_differential
    FROM team_results
    GROUP BY season, team
)
-- Update the standing table
UPDATE standing
SET 
    wins = COALESCE((SELECT total_wins FROM aggregated_results ar WHERE ar.season = standing.season AND ar.team = standing.team), 0),
    losses = COALESCE((SELECT total_losses FROM aggregated_results ar WHERE ar.season = standing.season AND ar.team = standing.team), 0),
    ties = COALESCE((SELECT total_ties FROM aggregated_results ar WHERE ar.season = standing.season AND ar.team = standing.team), 0),
    battle_differential = COALESCE((SELECT total_battle_differential FROM aggregated_results ar WHERE ar.season = standing.season AND ar.team = standing.team), 0),
    points = 3 * COALESCE((SELECT total_wins FROM aggregated_results ar WHERE ar.season = standing.season AND ar.team = standing.team), 0) 
           + 1 * COALESCE((SELECT total_ties FROM aggregated_results ar WHERE ar.season = standing.season AND ar.team = standing.team), 0)
WHERE season = ?;  -- Only update standings for the specified season`

await db.run(query, season, season)
}