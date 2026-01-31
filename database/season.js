import { db } from "./database.js";

export async function loadCurrentSeason() {
  return await db.get("SELECT * FROM season ORDER BY number DESC LIMIT 1");
}

export async function loadAllSeasons() {
  const seasons = await db.all(
    "SELECT number FROM season ORDER BY number DESC",
  );
  const hasCurrentSeason = await db.get(
    "SELECT matchup.room != 'finals' OR SUM(pairing.dead IS NULL and pairing.winner IS NULL) > 0 \
     FROM matchup \
     INNER JOIN pairing ON pairing.matchup = matchup.id \
     GROUP BY matchup.id \
     ORDER BY matchup.id DESC \
     LIMIT 1",
  );

  return { seasons, hasCurrentSeason };
}

export async function saveNewSeason(season, length, playoffSize) {
  await db.run(
    "INSERT INTO season (number, current_week, regular_weeks, playoff_size) VALUES (?, 0, ?, ?)",
    season,
    length,
    playoffSize,
  );
}

export async function saveBackfillSeason(season, length, playoffSize, winner) {
  const totalWeeks = length + Math.ceil(Math.log2(playoffSize));

  await db.run(
    "INSERT INTO season (number, current_week, regular_weeks, playoff_size, winner) VALUES (?, ?, ?, ?, SELECT id FROM team WHERE discord_snowflake = ?)",
    season,
    totalWeeks,
    length,
    playoffSize,
    winner
  );
}

export async function saveAdvanceWeek(season, week) {
  await db.run(
    "UPDATE season SET current_week = ? WHERE number = ?",
    week,
    season,
  );
}

export async function saveSeasonNumbers(
  season,
  minRoster,
  maxRoster,
  maxStars,
  r1stars,
  minLineup,
) {
  const query =
    "UPDATE season SET min_roster = ?, max_roster = ?, max_stars = ?, r1_stars = ?, min_lineup = ? WHERE number = ?";

  await db.run(
    query,
    minRoster,
    maxRoster,
    maxStars,
    r1stars,
    minLineup,
    season,
  );
}

export async function saveWinner(season, teamId) {
  await db.run("UPDATE season SET winner = ? WHERE number = ?", teamId, season);
}
