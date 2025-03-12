CREATE TABLE
    IF NOT EXISTS "role" (
        "id" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "discord_snowflake" TEXT NOT NULL,
        PRIMARY KEY ("id" AUTOINCREMENT)
    );

CREATE TABLE
    sqlite_sequence (name, seq);

CREATE TABLE
    IF NOT EXISTS "pairing" (
        "id" INTEGER NOT NULL,
        "matchup" INTEGER NOT NULL,
        "slot" INTEGER NOT NULL,
        "left_player" INTEGER,
        "right_player" INTEGER,
        "game1" TEXT,
        "game2" TEXT,
        "game3" TEXT,
        "game4" TEXT,
        "game5" TEXT,
        "winner" INTEGER,
        "dead" INTEGER,
        "predictions_message" TEXT,
        FOREIGN KEY ("matchup") REFERENCES "matchup" ("id"),
        FOREIGN KEY ("right_player") REFERENCES "player" ("id"),
        FOREIGN KEY ("left_player") REFERENCES "player" ("id"),
        PRIMARY KEY ("id" AUTOINCREMENT)
    );

CREATE TABLE
    IF NOT EXISTS "roster" (
        "id" INTEGER NOT NULL,
        "season" INTEGER NOT NULL,
        "team" INTEGER NOT NULL,
        "player" INTEGER NOT NULL,
        "role" INTEGER NOT NULL,
        FOREIGN KEY ("player") REFERENCES "player" ("id"),
        FOREIGN KEY ("role") REFERENCES "role" ("id"),
        FOREIGN KEY ("team") REFERENCES "team" ("id"),
        FOREIGN KEY ("season") REFERENCES "season" ("number"),
        PRIMARY KEY ("id" AUTOINCREMENT)
    );

CREATE TABLE
    IF NOT EXISTS "pstat" (
        "id" INTEGER NOT NULL,
        "player" INTEGER NOT NULL,
        "season" INTEGER NOT NULL,
        "wins" INTEGER NOT NULL DEFAULT 0,
        "act_wins" INTEGER NOT NULL DEFAULT 0,
        "losses" INTEGER NOT NULL DEFAULT 0,
        "act_losses" INTEGER NOT NULL DEFAULT 0,
        "ties" INTEGER NOT NULL DEFAULT 0,
        "star_points" INTEGER NOT NULL DEFAULT 0,
        "stars" INTEGER NOT NULL DEFAULT 1.5,
        PRIMARY KEY ("id" AUTOINCREMENT),
        FOREIGN KEY ("season") REFERENCES "season" ("number"),
        FOREIGN KEY ("player") REFERENCES "player" ("id")
    );

CREATE TABLE
    IF NOT EXISTS "team" (
        "id" INTEGER NOT NULL,
        "name" TEXT NOT NULL,
        "discord_snowflake" TEXT NOT NULL,
        "emoji" TEXT NOT NULL,
        "active" INTEGER DEFAULT 1,
        PRIMARY KEY ("id" AUTOINCREMENT)
    );

CREATE TABLE
    IF NOT EXISTS "player" (
        "id" INTEGER NOT NULL DEFAULT 0,
        "name" TEXT NOT NULL,
        "discord_snowflake" TEXT NOT NULL,
        "stars" NUMERIC,
        "active" INTEGER NOT NULL DEFAULT 1,
        "team" INTEGER,
        "role" INTEGER,
        "retain_rights" INTEGER,
        PRIMARY KEY ("id" AUTOINCREMENT),
        FOREIGN KEY ("retain_rights") REFERENCES "team" ("id"),
        FOREIGN KEY ("role") REFERENCES "role" ("id"),
        FOREIGN KEY ("team") REFERENCES "team" ("id")
    );

CREATE TABLE
    IF NOT EXISTS "matchup" (
        "id" INTEGER NOT NULL,
        "room" TEXT NOT NULL,
        "week" INTEGER NOT NULL,
        "left_team" INTEGER NOT NULL,
        "right_team" INTEGER NOT NULL,
        "rigged_count" INTEGER,
        "slots" INTEGER,
        "left_submitter" INTEGER,
        "right_submitter" INTEGER,
        "channel_message" TEXT,
        "predictions_message" TEXT,
        "schedule_message" TEXT,
        PRIMARY KEY ("id" AUTOINCREMENT),
        FOREIGN KEY ("left_team") REFERENCES "team" ("id"),
        FOREIGN KEY ("right_team") REFERENCES "team" ("id"),
        FOREIGN KEY ("week") REFERENCES "week" ("id"),
        FOREIGN KEY ("right_submitter") REFERENCES "player" ("id"),
        FOREIGN KEY ("left_submitter") REFERENCES "player" ("id")
    );

CREATE TABLE
    IF NOT EXISTS "week" (
        "id" INTEGER NOT NULL,
        "number" INTEGER NOT NULL,
        "season" INTEGER NOT NULL,
        PRIMARY KEY ("id" AUTOINCREMENT)
    );

CREATE TABLE
    IF NOT EXISTS "standing" (
        "id" INTEGER NOT NULL,
        "season" INTEGER NOT NULL,
        "team" INTEGER NOT NULL,
        "wins" INTEGER NOT NULL DEFAULT 0,
        "losses" INTEGER NOT NULL DEFAULT 0,
        "ties" INTEGER NOT NULL DEFAULT 0,
        "battle_differential" INTEGER NOT NULL DEFAULT 0,
        "points" INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY ("id" AUTOINCREMENT),
        FOREIGN KEY ("team") REFERENCES "team" ("id"),
        FOREIGN KEY ("season") REFERENCES "season" ("number")
    );

CREATE TABLE
    IF NOT EXISTS "prediction" (
        "id" INTEGER NOT NULL,
        "pairing" INTEGER NOT NULL,
        "predictor_snowflake" TEXT NOT NULL,
        "predicted_winner" INTEGER NOT NULL,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("predicted_winner") REFERENCES "player" ("id"),
        FOREIGN KEY ("pairing") REFERENCES "pairing" ("id")
    );

CREATE TABLE
    IF NOT EXISTS "season" (
        "number" INTEGER NOT NULL DEFAULT 0,
        "current_week" INTEGER,
        "regular_weeks" INTEGER,
        "playoff_size" INTEGER,
        "min_roster" INTEGER,
        "max_roster" INTEGER,
        "max_stars" INTEGER,
        "r1_stars" INTEGER,
        "min_lineup" INTEGER,
        PRIMARY KEY ("number" AUTOINCREMENT)
    );

CREATE TABLE
    IF NOT EXISTS "draft" (
        "id" INTEGER NOT NULL,
        "season" INTEGER NOT NULL,
        "round" INTEGER NOT NULL,
        "pick_order" INTEGER NOT NULL,
        "team" INTEGER NOT NULL,
        "pick" INTEGER,
        PRIMARY KEY ("id"),
        FOREIGN KEY ("pick") REFERENCES "player" ("id"),
        FOREIGN KEY ("season") REFERENCES "season" ("number"),
        FOREIGN KEY ("team") REFERENCES "team" ("id")
    );
