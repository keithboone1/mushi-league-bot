import express from "express";
import { loadTeamSheet } from "../database/team.js";
import { loadAllSeasons } from "../database/season.js";
import { openDb } from "../database/database.js";
import "dotenv/config";
import cors from "cors";
import { loadAllTeams } from "../database/roster.js";
import { loadWebStandings } from "../database/standing.js";
import { loadSchedule } from "../database/pairing.js";
import { loadPlayerStats } from "../database/pstat.js";
import { loadDraft } from "../database/draft.js";
import { loadAllPlayersEver, loadPlayerHistory } from "../database/player.js";
import { loadPredictionsStandings } from "../database/prediction.js";

const app = express();
const port = 3001;

app.use(cors());

app.get("/api/seasons", async (req, res) => {
  const data = await loadAllSeasons();
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.get("/api/season/:number", async (req, res) => {
  const data = await loadAllTeams(req.params.number);
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.get("/api/season/:number/schedule", async (req, res) => {
  const data = await loadSchedule(req.params.number);
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.get("/api/season/:number/standings", async (req, res) => {
  const data = await loadWebStandings(req.params.number);
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.get("/api/season/:number/players", async (req, res) => {
  const data = await loadPlayerStats(req.params.number);
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.get("/api/season/:number/predictions", async (req, res) => {
  const data = await loadPredictionsStandings(req.params.number);
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.get("/api/season/:number/draft", async (req, res) => {
  const data = await loadDraft(req.params.number);
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.get("/api/season/:number/team/:id", async (req, res) => {
  const data = await loadTeamSheet(req.params.id, req.params.number);
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.get("/api/players", async (req, res) => {
  const data = await loadAllPlayersEver();
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.get("/api/players/:id", async (req, res) => {
  const data = await loadPlayerHistory(req.params.id);
  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.listen(port, async () => {
  console.log(`Express server running on port ${port}...`);
  await openDb();
});
