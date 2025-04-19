import { twJoin, twMerge } from "tailwind-merge";
import type { Route } from "./+types/schedule";
import { teamColorText, weekName } from "util/util";
import { format } from "date-fns";
import { NavLink } from "react-router";

export default function Schedule({ loaderData }: Route.ComponentProps) {
  return (
    <div className="flex flex-col gap-3">
      {loaderData.weeks.map((week, i) => (
        <details
          {...(loaderData.currentWeek === null || loaderData.currentWeek <= i + 1
            ? { open: true }
            : {})}
        >
          <summary>
            <h2 className="inline">
              {weekName(i + 1, loaderData.regularWeeks, loaderData.playoffSize)}
            </h2>
          </summary>

          {week.missingLineups.length > 0 && (
            <div className="mb-2">
              <div>Still need lineups from:</div>
              <div className="flex gap-2 flex-wrap">
                {week.missingLineups.map((team) => (
                  <div
                    className={twJoin(
                      "px-1 whitespace-nowrap",
                      teamColorText(team.color)
                    )}
                    style={{ backgroundColor: team.color }}
                  >
                    {team.name}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 w-fit flex-wrap" key={i}>
            {week.matchups.map((matchup) => {
              const { leftWins, rightWins } = matchup.pairings.reduce(
                (accum, item) => {
                  if (item.leftPlayer.won) {
                    accum.leftWins += 1;
                  } else if (item.rightPlayer.won) {
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
                        className={twJoin(
                          "text-lg font-semibold whitespace-nowrap text-center border border-black",
                          teamColorText(matchup.leftTeam.color)
                        )}
                        style={{ backgroundColor: matchup.leftTeam.color }}
                      >
                        {matchup.leftTeam.name}
                      </th>
                      <th className="text-lg text-center font-bold border">
                        {scoreString}
                      </th>
                      <th
                        className={twJoin(
                          "text-lg font-semibold whitespace-nowrap text-center border border-black",
                          teamColorText(matchup.rightTeam.color)
                        )}
                        style={{ backgroundColor: matchup.rightTeam.color }}
                      >
                        {matchup.rightTeam.name}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchup.pairings.map((p) => {
                      const gameLinks = p.dead
                        ? [
                            <span key={0} className="basis-full text-center">
                              dead
                            </span>,
                          ]
                        : p.act
                        ? [
                            <span key={0} className="basis-full text-center">
                              act
                            </span>,
                          ]
                        : p.games.length > 0
                        ? p.games.map((game, i) =>
                            game.startsWith("http") ? (
                              <div
                                key={i}
                                className="basis-full flex px-2 not-last:border-r"
                              >
                                <a
                                  className="basis-full grow text-center text-sm text-[blue] active:text-[purple] underline"
                                  href={game}
                                >{`g${i + 1}`}</a>
                              </div>
                            ) : (
                              <span
                                key={i}
                                className="basis-full not-last:border-r text-center"
                              >
                                {game}
                              </span>
                            )
                          )
                        : p.scheduledTime
                        ? [
                            <span key="time" className="basis-full text-center">
                              {format(p.scheduledTime, "ccc, MMM d p")}
                            </span>,
                          ]
                        : [<span key="blank" />];
                      while (p.games.length > 0 && gameLinks.length < 3) {
                        gameLinks.push(
                          <span key={2} className="basis-full px-2" />
                        );
                      }
                      return (
                        <tr key={p.leftPlayer.id}>
                          <td
                            className={twMerge(
                              "text-right border pr-2",
                              p.leftPlayer.won && "bg-green-100",
                              p.leftPlayer.lost && "bg-red-100",
                              p.dead && "bg-gray-200"
                            )}
                          >
                            <NavLink
                              to={`/players/${p.leftPlayer.id}`}
                              className="underline"
                            >
                              {p.leftPlayer.name}
                            </NavLink>
                          </td>
                          <td className="border-t">
                            <div className="flex items-center">{gameLinks}</div>
                          </td>
                          <td
                            className={twMerge(
                              "text-left border pl-2",
                              p.rightPlayer.won && "bg-green-100",
                              p.rightPlayer.lost && "bg-red-100",
                              p.dead && "bg-gray-200"
                            )}
                          >
                            <NavLink
                              to={`/players/${p.rightPlayer.id}`}
                              className="underline"
                            >
                              {p.rightPlayer.name}
                            </NavLink>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              );
            })}
          </div>
        </details>
      ))}
    </div>
  );
}

type ScheduleQuery = {
  schedule: {
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
    scheduled_datetime: number;
    current_week: number;
    seasonWinner: number;
  }[];
  missingLineups: { name: string; color: string; week: number }[];
};

type PlayerData = {
  id: number;
  name: string;
  won: boolean;
  lost: boolean;
};

type PairingData = {
  leftPlayer: PlayerData;
  rightPlayer: PlayerData;
  dead: boolean;
  act: boolean;
  scheduledTime: Date | null;
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
  currentWeek: number | null;
  weeks: {
    missingLineups: { name: string; color: string }[];
    matchups: MatchupData[];
  }[];
};

export async function loader({ params: { season } }: Route.LoaderArgs) {
  const rawData = (await (
    await fetch(`http://localhost:3001/api/season/${season}/schedule`)
  ).json()) as ScheduleQuery;

  const regularWeeks = rawData.schedule[0].regular_weeks;
  const playoffSize = rawData.schedule[0].playoff_size;
  const totalWeeks = Math.ceil(regularWeeks + Math.log2(playoffSize));
  const weekWithMissingLineups = rawData.missingLineups.at(0)?.week;

  const initialAccum: ScheduleData = {
    regularWeeks: rawData.schedule[0].regular_weeks,
    playoffSize: rawData.schedule[0].playoff_size,
    currentWeek: rawData.schedule[0].seasonWinner
      ? null
      : rawData.schedule[0].current_week,
    weeks: new Array(totalWeeks),
  };

  const formattedSchedule = rawData.schedule.reduce((accum, item) => {
    // canary value for the week existing
    if (!item.leftTeamName) {
      return accum;
    }

    let week = accum.weeks.at(item.weekNumber - 1);

    if (week === undefined) {
      week = { matchups: [], missingLineups: [] };
      accum.weeks[item.weekNumber - 1] = week;
    }

    let matchup = week.matchups.find(
      (matchup) => matchup.id === item.matchupId
    );

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
      accum.weeks[item.weekNumber - 1].matchups.push(matchup);
    }

    // canary value for the pairings existing
    if (!item.leftPlayerName) {
      return accum;
    }

    const games = [
      item.game1,
      item.game2,
      item.game3,
      item.game4,
      item.game5,
    ].filter(Boolean);

    matchup.pairings.push({
      leftPlayer: {
        name: item.leftPlayerName,
        id: item.leftPlayerId,
        won: item.winner === item.leftPlayerId,
        lost: item.winner === item.rightPlayerId,
      },
      rightPlayer: {
        name: item.rightPlayerName,
        id: item.rightPlayerId,
        won: item.winner === item.rightPlayerId,
        lost: item.winner === item.leftPlayerId,
      },
      dead: item.dead === 1,
      act: !!item.winner && games.length === 0,
      scheduledTime: !!item.scheduled_datetime
        ? new Date(item.scheduled_datetime)
        : null,
      games,
    });

    return accum;
  }, initialAccum);

  if (weekWithMissingLineups) {
    formattedSchedule.weeks[weekWithMissingLineups - 1].missingLineups =
      rawData.missingLineups;
  }

  return formattedSchedule;
}
