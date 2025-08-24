import type { Route } from "./+types/predictions";

export default function Players({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h2>Predictions Standings</h2>
      <table className="border border-collapse">
        <thead className="border">
          <tr>
            <th className="px-2">Rank</th>
            <th className="px-2">Player</th>
            <th className="px-2">Correct guesses</th>
            <th className="px-2">Total guesses</th>
            <th className="px-2">Accuracy</th>
          </tr>
        </thead>
        <tbody>
          {loaderData.map((player, i) => (
            <tr key={player.name}>
              <td className="px-2 text-center">{i + 1}</td>
              <td className="px-2 font-semibold">{player.name}</td>
              <td className="px-2 text-center">{player.correctPredictions}</td>
              <td className="px-2 text-center">{player.totalPredictions}</td>
              <td className="px-2 text-center">
                {`${(
                  (player.correctPredictions / player.totalPredictions) *
                  100
                ).toFixed(1)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

type PredictionsQuery = {
  name: string | null;
  correctPredictions: number;
  totalPredictions: number;
}[];

export async function loader({ params: { season } }: Route.LoaderArgs) {
  return (await (
    await fetch(`https://mushileague.gg/api/season/${season}/predictions`)
  ).json()) as PredictionsQuery;
}
