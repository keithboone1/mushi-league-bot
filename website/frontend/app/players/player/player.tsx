import { NavLink } from "react-router";
import { twJoin, twMerge } from "tailwind-merge";
import { ArrowLeft } from "lucide-react";
import type { Route } from "./+types/player";
import { teamColorText, weekName } from "util/util";

type PlayerQuery = {
  playerInfo: {
    playerName: string;
    season: number;
    roleName: string;
    stars: number;
    wins: number;
    act_wins: number;
    losses: number;
    act_losses: number;
    ties: number;
    star_points: number;
    teamId: number;
    teamName: string;
    color: string;
  }[];
  pairings: {
    slot: number;
    game1?: string;
    game2?: string;
    game3?: string;
    game4?: string;
    game5?: string;
    winner?: number;
    dead?: number;
    season: number;
    weekNumber: number;
    regular_weeks: number;
    playoff_size: number;
    opponentId: number;
    opponentName: string;
    opponentStars: number;
    opponentTeam: string;
    opponentTeamColor: string;
  }[];
};

export default function Season({
  params: { playerId },
  loaderData,
}: Route.ComponentProps) {
  const results = {
    dead: <span className="px-1 bg-gray-200">DEAD</span>,
    won: <span className="px-1 bg-green-100">WON</span>,
    actWon: <span className="px-1 bg-green-100">WON (ACT)</span>,
    lost: <span className="px-1 bg-red-100">LOST</span>,
    actLost: <span className="px-1 bg-red-100">LOST (ACT)</span>,
  };

  return (
    <>
      <NavLink to="/players" className="inline-flex gap-1 items-center">
        <ArrowLeft size={16} />
        Return to all players
      </NavLink>
      <h1 className="mb-1">{loaderData[0].playerName}</h1>
      {loaderData.map((season) => (
        <div className="my-6">
          <h2 id={season.season.toString()}>{`Season ${season.season}`}</h2>
          <div className="font-medium">
            {season.roleName} on{" "}
            <span
              className={twJoin("px-1", teamColorText(season.color))}
              style={{ backgroundColor: season.color }}
            >
              {season.teamName}
            </span> ({season.stars} stars)
          </div>
          {season.pairings?.map((pairing) => {
            const result = pairing.dead
              ? results.dead
              : pairing.winner?.toString() === playerId
              ? pairing.game1
                ? results.won
                : results.actWon
              : pairing.winner
              ? pairing.game1
                ? results.lost
                : results.actLost
              : null;

            const games = [
              pairing.game1,
              pairing.game2,
              pairing.game3,
              pairing.game4,
              pairing.game5,
            ].filter(Boolean) as string[];

            const gameSpans = games.map((game, i) =>
              game.startsWith("http") ? (
                <span
                  key={i}
                  className="basis-full flex px-2 not-last:border-r"
                >
                  <a
                    className="basis-full grow text-center text-sm text-[blue] active:text-[purple] underline whitespace-nowrap"
                    href={game}
                  >{`game ${i + 1}`}</a>
                </span>
              ) : (
                <span
                  key={i}
                  className="basis-full not-last:border-r text-center"
                >
                  {game}
                </span>
              )
            );

            return (
              <div
                key={`${pairing.season} ${pairing.weekNumber}`}
                className="my-4"
              >
                <h3>
                  {weekName(
                    pairing.weekNumber,
                    pairing.regular_weeks,
                    pairing.playoff_size
                  )}{" "}
                  vs{" "}
                  <span
                    className={twJoin(
                      "px-1",
                      teamColorText(pairing.opponentTeamColor)
                    )}
                    style={{ backgroundColor: pairing.opponentTeamColor }}
                  >
                    {pairing.opponentTeam}
                  </span>
                </h3>
                <div>
                  Slot {pairing.slot}: {result} vs{" "}
                  <NavLink
                    to={`/players/${pairing.opponentId}`}
                    className="underline"
                  >
                    {pairing.opponentName}
                  </NavLink>{" "}
                  ({+pairing.opponentStars.toFixed(2)} stars)
                </div>
                {gameSpans.length > 0 && (
                  <div className="flex w-fit">{gameSpans}</div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </>
  );
}

export async function loader({ params: { playerId } }: Route.LoaderArgs) {
  const rawData = (await (
    await fetch(`https://mushileague.gg/api/players/${playerId}`)
  ).json()) as PlayerQuery;

  const pairingsBySeason = rawData.pairings.reduce((accum, pairing) => {
    accum[pairing.season] = [...(accum[pairing.season] ?? []), pairing];
    return accum;
  }, {} as Record<number, PlayerQuery["pairings"]>);

  return rawData.playerInfo.map((season) => ({
    ...season,
    pairings: pairingsBySeason[season.season],
  }));
}
