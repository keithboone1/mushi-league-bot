import { NavLink } from "react-router";
import type { Route } from "./+types/players";
import { ArrowLeft } from "lucide-react";

export default function Players({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <NavLink to="/" className="inline-flex gap-1 items-center">
        <ArrowLeft size={16} />
        Return to home
      </NavLink>
      <h1>All players</h1>
      <table className="border border-collapse">
        <thead className="border">
          <tr>
            <th className="px-2">Player</th>
            <th className="px-2">Total Seasons</th>
            <th className="px-2">Season Wins</th>
            <th className="px-2">Most Recent Season</th>
            <th className="px-2">Total Games</th>
            <th className="px-2">Win Rate</th>
            <th className="px-2">Total Wins</th>
            <th className="px-2">Total Act W</th>
            <th className="px-2">Total Losses</th>
            <th className="px-2">Total Act L</th>
            <th className="px-2">Total Ties</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.map((player) => (
            <tr key={player.id}>
              <td className="px-2 py-0.5 font-semibold underline">
                <NavLink to={`/players/${player.id}`}>{player.name}</NavLink>
              </td>
              <td className="px-2 text-center">{player.total_seasons}</td>
              <td className="px-2 text-center">{player.season_wins}</td>
              <td className="px-2 text-center">{player.most_recent_season}</td>
              <td className="px-2 text-center">{player.total_games}</td>
              <td className="px-2 text-center">{`${(
                player.win_rate * 100
              ).toFixed(1)}%`}</td>
              <td className="px-2 text-center">{player.wins}</td>
              <td className="px-2 text-center">{player.act_wins}</td>
              <td className="px-2 text-center">{player.losses}</td>
              <td className="px-2 text-center">{player.act_losses}</td>
              <td className="px-2 text-center">{player.ties}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

type PlayersQuery = {
  id: number;
  name: string;
  most_recent_season: number;
  total_seasons: number;
  season_wins: number;
  total_games: number;
  win_rate: number;
  wins: number;
  act_wins: number;
  losses: number;
  act_losses: number;
  ties: number;
}[];

export async function loader() {
  return (await (
    await fetch(`https://mushileague.gg/api/players`)
  ).json()) as PlayersQuery;
}
