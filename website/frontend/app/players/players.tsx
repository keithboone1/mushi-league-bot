import { useState, useMemo } from "react";
import { NavLink } from "react-router";
import type { Route } from "./+types/players";
import { ArrowLeft } from "lucide-react";

type SortOrder = "asc" | "desc";

export default function Players({ loaderData }: Route.ComponentProps) {
  const [sortKey, setSortKey] = useState<string>("wins");
	const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

	const sortedData = useMemo(() => {
	  return [...loaderData].sort((a, b) => {
		const aVal = a[sortKey];
		const bVal = b[sortKey];

		const isEmpty = (val: any) =>
		  val === null || val === undefined || val === "";

		if (isEmpty(aVal) && isEmpty(bVal)) return 0;
		if (isEmpty(aVal)) return 1;
		if (isEmpty(bVal)) return -1;

		if (typeof aVal === "number" && typeof bVal === "number") {
		  return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
		}

		return sortOrder === "asc"
		  ? String(aVal).localeCompare(String(bVal))
		  : String(bVal).localeCompare(String(aVal));
	  });
	}, [loaderData, sortKey, sortOrder]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const renderHeader = (label: string, key: string) => (
    <th
      className="px-2 cursor-pointer select-none hover:underline"
      onClick={() => handleSort(key)}
    >
      {label}
      {sortKey === key ? (sortOrder === "asc" ? " ↑" : " ↓") : ""}
    </th>
  );

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
            {renderHeader("Player", "name")}
            {renderHeader("Total Seasons", "total_seasons")}
            {renderHeader("Season Wins", "season_wins")}
            {renderHeader("Most Recent Season", "most_recent_season")}
            {renderHeader("Total Games", "total_games")}
            {renderHeader("Win Rate", "win_rate")}
            {renderHeader("Total Wins", "wins")}
            {renderHeader("Total Act W", "act_wins")}
            {renderHeader("Total Losses", "losses")}
            {renderHeader("Total Act L", "act_losses")}
            {renderHeader("Total Ties", "ties")}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((player) => (
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
