import { Link } from "react-router";
import type { Route } from "./+types/welcome";

type Season = {
  number: number;
};

type SeasonsQuery = {
  seasons: Season[];
  hasCurrentSeason: boolean;
};

export default function Welcome({ loaderData }: Route.ComponentProps) {
  const pastSeasons = loaderData.hasCurrentSeason
    ? loaderData.seasons.slice(1)
    : loaderData.seasons;

  const currentSeason = loaderData.hasCurrentSeason
    ? loaderData.seasons[0]
    : null;

  return (
    <div className="flex flex-col items-center">
      <h1 className="mb-8 text-center">
        Mushi League, the ADV OU team tournament
      </h1>
      {currentSeason && (
        <>
          <h2 className="mb-2 text-center">Current Season</h2>
          <Link
            to={`/season/${currentSeason.number}/schedule`}
            className="border rounded-md text-center hover:bg-gray-50"
          >
            Season {currentSeason.number}
          </Link>
        </>
      )}
      <h2 className="mb-2 text-center">Past Seasons</h2>
      <div className="flex flex-col gap-2 max-w-full w-sm">
        {pastSeasons.map((s) =>
          s.hasData ? (
            <Link
              key={s.number}
              to={`/season/${s.number}/schedule`}
              className="border rounded-md text-center hover:bg-gray-50"
            >
              Season {s.number}
            </Link>
          ) : (
            <p key={s.number} className="text-center">
              Season {s.number} (coming soon!)
            </p>
          )
        )}
      </div>
    </div>
  );
}

export async function loader() {
  const rawData = (await (
    await fetch("https://mushileague.gg/api/seasons")
  ).json()) as SeasonsQuery;

  const lastNumber = rawData.seasons[0].number;
  const firstNumber = rawData.seasons[rawData.seasons.length - 1].number;

  return {
    hasCurrentSeason: rawData.hasCurrentSeason,
    seasons: new Array(lastNumber + 1).fill(null).map((_, i) => ({
      number: lastNumber - i,
      hasData: lastNumber - i >= firstNumber,
    })),
  };
}
