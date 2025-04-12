import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  route("/", "./welcome/welcome.tsx"),
  route("players", "./players/parent.tsx", [
    index("./players/players.tsx"),
    route(":playerId", "./players/player/player.tsx"),
  ]),
  route("season/:season", "./season/season.tsx", [
    route("team/:teamId", "./season/team/team.tsx"),
    route("schedule", "./season/schedule/schedule.tsx"),
    route("standings", "./season/standings/standings.tsx"),
    route("players", "./season/players/players.tsx"),
    route("draft", "./season/draft/draft.tsx"),
  ]),
] satisfies RouteConfig;
