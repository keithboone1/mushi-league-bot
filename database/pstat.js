import { db } from "./database.js";
import { fixFloat } from "../bot/commands/util.js";

export async function loadPlayerStats(season) {
  const query =
    "SELECT player.id, player.name, (pstat.wins + pstat.act_wins - pstat.losses - pstat.act_losses) AS differential, \
     pstat.wins, pstat.act_wins, pstat.losses, pstat.act_losses, pstat.ties, pstat.star_points, pstat.stars \
     FROM pstat \
     LEFT JOIN player ON (player.id = pstat.player AND pstat.season = ?) \
     WHERE pstat.season = ? OR player.active = 1 \
     ORDER BY differential DESC, pstat.star_points DESC, pstat.stars DESC";
  return await db.all(query, season, season);
}

export async function savePlayerStatUpdate(season, pairing) {
  if (pairing.dead) {
    await db.run(
      "UPDATE pstat SET ties = ties + 1 WHERE season = ? AND (player = ? OR player = ?)",
      season,
      pairing.winningId,
      pairing.losingId
    );
  } else if (!pairing.game1) {
    await db.run(
      "UPDATE pstat SET act_wins = act_wins + 1 WHERE season = ? AND player = ?",
      season,
      pairing.winningId
    );
    await db.run(
      "UPDATE pstat SET act_losses = act_losses + 1 WHERE season = ? AND player = ?",
      season,
      pairing.losingId
    );
  } else {
    const spread = getSpread(pairing.winningStars, pairing.losingStars);
    await db.run(
      "UPDATE pstat SET wins = wins + 1, star_points = star_points + ? WHERE season = ? AND player = ?",
      spread,
      season,
      pairing.winningId
    );
    await db.run(
      "UPDATE pstat SET losses = losses + 1, star_points = star_points - ? WHERE season = ? AND player = ?",
      spread,
      season,
      pairing.losingId
    );
  }
}

function getSpread(winningStars, losingStars) {
  const x = fixFloat(winningStars - losingStars);

  if (x > 1) return 5;
  if (x < -1) return 15;
  return 10;
}

export async function saveRecalculatePstats(season) {
  const query = `-- Update player statistics (pstat) based on pairing results
-- This query calculates wins, act_wins, losses, act_losses, ties, and star_points for each player
-- Replace :season with the actual season number you want to update

WITH player_pairing_results AS (
    -- Get all pairings for the season with player information
    SELECT 
        p.id AS pairing_id,
        w.season,
        p.left_player,
        p.right_player,
        p.winner,
        p.game1,
        p.dead
    FROM pairing p
    JOIN matchup m ON p.matchup = m.id
    JOIN week w ON m.week = w.id
    WHERE w.season = ?
),
player_outcomes AS (
    -- Calculate outcomes for each player in each pairing
    SELECT 
        pairing_id,
        season,
        left_player AS player,
        CASE WHEN winner = left_player AND game1 IS NOT NULL THEN 1 ELSE 0 END AS wins,
        CASE WHEN winner = left_player AND game1 IS NULL THEN 1 ELSE 0 END AS act_wins,
        CASE WHEN dead = 1 THEN 1 ELSE 0 END AS ties,
        CASE WHEN dead IS NULL AND game1 IS NOT NULL AND winner != left_player AND winner IS NOT NULL THEN 1 ELSE 0 END AS losses,
        CASE WHEN dead IS NULL AND game1 IS NULL AND winner != left_player AND winner IS NOT NULL THEN 1 ELSE 0 END AS act_losses,
        right_player AS opponent,
        winner,
        game1
    FROM player_pairing_results
    WHERE left_player IS NOT NULL
    
    UNION ALL
    
    SELECT 
        pairing_id,
        season,
        right_player AS player,
        CASE WHEN winner = right_player AND game1 IS NOT NULL THEN 1 ELSE 0 END AS wins,
        CASE WHEN winner = right_player AND game1 IS NULL THEN 1 ELSE 0 END AS act_wins,
        CASE WHEN dead = 1 THEN 1 ELSE 0 END AS ties,
        CASE WHEN dead IS NULL AND game1 IS NOT NULL AND winner != right_player AND winner IS NOT NULL THEN 1 ELSE 0 END AS losses,
        CASE WHEN dead IS NULL AND game1 IS NULL AND winner != right_player AND winner IS NOT NULL THEN 1 ELSE 0 END AS act_losses,
        left_player AS opponent,
        winner,
        game1
    FROM player_pairing_results
    WHERE right_player IS NOT NULL
),
star_points_calculations AS (
    -- Calculate star points gained or lost from each pairing
    SELECT 
        po.pairing_id,
        po.season,
        po.player,
        po.opponent,
        po.wins,
        po.losses,
        player_pstat.stars AS player_stars,
        opponent_pstat.stars AS opponent_stars,
        CASE
            -- WIN: gain star points
            WHEN po.wins = 1 THEN
                CASE
                    WHEN ABS(opponent_pstat.stars - player_pstat.stars) <= 1 THEN 10
                    WHEN opponent_pstat.stars < player_pstat.stars - 1 THEN 5
                    WHEN opponent_pstat.stars > player_pstat.stars + 1 THEN 15
                    ELSE 0
                END
            -- LOSS: lose star points
            WHEN po.losses = 1 THEN
                CASE
                    WHEN ABS(opponent_pstat.stars - player_pstat.stars) <= 1 THEN -10
                    WHEN opponent_pstat.stars < player_pstat.stars - 1 THEN -15
                    WHEN opponent_pstat.stars > player_pstat.stars + 1 THEN -5
                    ELSE 0
                END
            ELSE 0
        END AS star_points_delta
    FROM player_outcomes po
    LEFT JOIN pstat player_pstat ON player_pstat.player = po.player AND player_pstat.season = po.season
    LEFT JOIN pstat opponent_pstat ON opponent_pstat.player = po.opponent AND opponent_pstat.season = po.season
    WHERE po.opponent IS NOT NULL  -- Only calculate star points when there's an opponent
),
aggregated_stats AS (
    -- Aggregate all stats by player and season
    SELECT 
        po.season,
        po.player,
        SUM(po.wins) AS total_wins,
        SUM(po.act_wins) AS total_act_wins,
        SUM(po.losses) AS total_losses,
        SUM(po.act_losses) AS total_act_losses,
        SUM(po.ties) AS total_ties,
        COALESCE(SUM(spc.star_points_delta), 0) AS total_star_points
    FROM player_outcomes po
    LEFT JOIN star_points_calculations spc 
        ON spc.pairing_id = po.pairing_id 
        AND spc.player = po.player
    GROUP BY po.season, po.player
)
-- Update the pstat table
UPDATE pstat
SET 
    wins = COALESCE((SELECT total_wins FROM aggregated_stats ast WHERE ast.season = pstat.season AND ast.player = pstat.player), 0),
    act_wins = COALESCE((SELECT total_act_wins FROM aggregated_stats ast WHERE ast.season = pstat.season AND ast.player = pstat.player), 0),
    losses = COALESCE((SELECT total_losses FROM aggregated_stats ast WHERE ast.season = pstat.season AND ast.player = pstat.player), 0),
    act_losses = COALESCE((SELECT total_act_losses FROM aggregated_stats ast WHERE ast.season = pstat.season AND ast.player = pstat.player), 0),
    ties = COALESCE((SELECT total_ties FROM aggregated_stats ast WHERE ast.season = pstat.season AND ast.player = pstat.player), 0),
    star_points = COALESCE((SELECT total_star_points FROM aggregated_stats ast WHERE ast.season = pstat.season AND ast.player = pstat.player), 0)
WHERE season = ?;  -- Only update pstat records for the specified season`

await db.run(query, season, season)
}