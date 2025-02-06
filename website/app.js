import express from "express";
import {
  loadTeams,
  loadActiveTeams,
  loadTeam,
  loadTeamSheet,
} from "../database/team.js";
import { loadAllSeasons, loadCurrentSeason } from "../database/season.js";
import { openDb } from "../database/database.js";
import "dotenv/config";
import cors from "cors";
import { loadAllTeams } from "../database/roster.js";
import { loadSchedule } from "../database/pairing.js";

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

app.get("/api/season/:number/team/:id", async (req, res) => {
  const data = await loadTeamSheet(req.params.id, req.params.number);

  res.set("Access-Control-Allow-Origin", "*");
  res.send(JSON.stringify(data));
});

app.listen(port, async () => {
  await openDb();
});
