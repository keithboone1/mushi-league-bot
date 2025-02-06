import type { Route } from "./+types/schedule";

export default function Schedule({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-3">
      {loaderData.weeks.map((week, i) => (
        <div className="flex gap-3 w-fit" key={i}>
          {week.map((matchup) => {
            const { leftWins, rightWins } = matchup.pairings.reduce(
              (accum, item) => {
                if (item.leftPlayer.winner) {
                  accum.leftWins += 1;
                } else if (item.rightPlayer.winner) {
                  accum.rightWins += 1;
                }
                return accum;
              },
              { leftWins: 0, rightWins: 0 }
            );

            const scoreString = `${leftWins} - ${rightWins}`;

            return (
              <table
                key={matchup.id}
                className="w-3xl border-collapse border table-fixed"
              >
                <thead>
                  <tr className="h-8">
                    <th
                      className="text-lg font-semibold whitespace-nowrap text-center border"
                      style={{ backgroundColor: matchup.leftTeam.color }}
                    >
                      {matchup.leftTeam.name}
                    </th>
                    <th className="text-lg text-center font-bold border">
                      {scoreString}
                    </th>
                    <th
                      className="text-lg font-semibold whitespace-nowrap text-center border"
                      style={{ backgroundColor: matchup.rightTeam.color }}
                    >
                      {matchup.rightTeam.name}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matchup.pairings.map((p) => {
                    const gameLinks = p.dead
                      ? [<span className="basis-full text-center">dead</span>]
                      : p.games.map((game, i) =>
                          game.startsWith("http") ? (
                            <div className="basis-full flex px-2 not-last:border-r">
                              <a
                                className="basis-full grow text-center underline text-sm text-[blue] active:text-[purple]"
                                href={game}
                              >{`g${i + 1}`}</a>
                            </div>
                          ) : (
                            <span className="basis-full not-last:border-r text-center">
                              {game}
                            </span>
                          )
                        );
                    while (!p.dead && gameLinks.length < 3) {
                      gameLinks.push(<span className="basis-full px-2" />);
                    }
                    return (
                      <tr>
                        <td className="text-right border pr-2">
                          {p.leftPlayer.name}
                        </td>
                        <td className="border-t">
                          <div className="flex items-center">
                            {gameLinks}
                          </div>
                        </td>
                        <td className="text-left border pl-2">
                          {p.rightPlayer.name}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })}
        </div>
      ))}
    </div>
  );
}

type ScheduleQuery = {
  leftPlayerId: number;
  leftPlayerName: string;
  leftTeamId: number;
  leftTeamName: string;
  leftTeamColor: string;
  rightPlayerId: number;
  rightPlayerName: string;
  rightTeamId: number;
  rightTeamName: string;
  rightTeamColor: string;
  regular_weeks: number;
  playoff_size: number;
  winner: number;
  dead: number;
  game1: string;
  game2: string;
  game3: string;
  game4: string;
  game5: string;
  weekNumber: number;
  matchupId: number;
}[];

type PlayerData = {
  id: number;
  name: string;
  winner: boolean;
};

type PairingData = {
  leftPlayer: PlayerData;
  rightPlayer: PlayerData;
  dead: boolean;
  games: string[];
};

type TeamData = {
  id: number;
  color: string;
  name: string;
};

type MatchupData = {
  id: number;
  leftTeam: TeamData;
  rightTeam: TeamData;
  pairings: PairingData[];
};

type ScheduleData = {
  regularWeeks: number;
  playoffSize: number;
  weeks: MatchupData[][];
};

export async function loader({ params: { season } }: Route.LoaderArgs) {
  const rawData = (await (
    await fetch(`http://localhost:3001/api/season/${season}/schedule`)
  ).json()) as ScheduleQuery;

  const regularWeeks = rawData[0].regular_weeks;
  const playoffSize = rawData[0].playoff_size;
  const totalWeeks = Math.ceil(regularWeeks + Math.log2(playoffSize));

  const initialAccum: ScheduleData = {
    regularWeeks: rawData[0].regular_weeks,
    playoffSize: rawData[0].playoff_size,
    weeks: new Array(totalWeeks),
  };

  return rawData.reduce((accum, item) => {
    let week = accum.weeks.at(item.weekNumber - 1);

    if (week === undefined) {
      week = [];
      accum.weeks[item.weekNumber - 1] = week;
    }

    let matchup = week.find((matchup) => matchup.id === item.matchupId);

    if (matchup === undefined) {
      matchup = {
        id: item.matchupId,
        leftTeam: {
          id: item.leftTeamId,
          color: item.leftTeamColor,
          name: item.leftTeamName,
        },
        rightTeam: {
          id: item.rightTeamId,
          color: item.rightTeamColor,
          name: item.rightTeamName,
        },
        pairings: [],
      };
      accum.weeks[item.weekNumber - 1].push(matchup);
    }

    matchup.pairings.push({
      leftPlayer: {
        name: item.leftPlayerName,
        id: item.leftPlayerId,
        winner: item.winner === item.leftPlayerId,
      },
      rightPlayer: {
        name: item.rightPlayerName,
        id: item.rightPlayerId,
        winner: item.winner === item.rightPlayerId,
      },
      dead: item.dead === 1,
      games: [
        item.game1,
        item.game2,
        item.game3,
        item.game4,
        item.game5,
      ].filter(Boolean),
    });

    return accum;
  }, initialAccum);
}
