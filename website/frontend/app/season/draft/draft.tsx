import { teamColorText, teamInitials } from "util/util";
import type { Route } from "./+types/draft";
import { twJoin } from "tailwind-merge";
import { NavLink } from "react-router";

export default function Draft({ loaderData }: Route.ComponentProps) {
  const { captains, retains, picks, teamData } = loaderData;

  const mostCaptains = Math.max(...captains.map((team) => team.length));

  const mostRetains = Math.max(...retains.map((team) => team.length));

  return (
    <>
      <table
        className="border border-collapse table-fixed w-full mb-8"
        style={{ minWidth: 80 + 140 * picks[0].length }}
      >
        <tbody>
          <tr className="border">
            <td className="border w-20 p-1">Team</td>
            {teamData.map((team, i) => (
              <td className="border min-w-24" key={i}>
                <div
                  className={twJoin(
                    "font-bold p-1",
                    teamColorText(team.team.color)
                  )}
                  style={{ backgroundColor: team.team.color }}
                >
                  {teamInitials(team.team.name)}
                </div>
                <div className="text-sm p-1 flex gap-1 justify-between">
                  <div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-0">Total stars</div>
                  <div className="shrink-0 font-semibold">
                    {team.totalStars.toFixed(2)}
                  </div>
                </div>
                <div className="text-sm p-1 flex gap-1 justify-between">
                  <div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-0">Max stars next</div>
                  <div className="shrink-0 font-semibold">
                    {team.maxStarsNext}
                  </div>
                </div>
                <div className="text-sm p-1 flex gap-1 justify-between">
                  <div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-0">Roster size</div>
                  <div className="shrink-0 font-semibold">
                    {team.totalPlayers}
                  </div>
                </div>
                <div className="text-sm p-1 flex gap-1 justify-between">
                  <div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-0">Min. picks remaining</div>
                  <div className="shrink-0 font-semibold">
                    {team.remainingPicksForMinRoster}
                  </div>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <table
        className="border border-collapse table-fixed w-full mb-8"
        style={{ minWidth: 80 + 140 * picks[0].length }}
      >
        <tbody>
          {new Array(mostCaptains).fill(" ").map((_, i) => (
            <tr key={`Captains ${i}`} className="border">
              <td className="border w-20 p-1">Captains</td>
              {captains.map((captain, j) => (
                <td className="border min-w-24" key={j}>
                  {captain[i] && (
                    <>
                      <div
                        className={twJoin(
                          "font-bold p-1",
                          teamColorText(captain[i].team.color)
                        )}
                        style={{ backgroundColor: captain[i].team.color }}
                      >
                        {teamInitials(captain[i].team.name)}
                      </div>
                      <div className="text-sm p-1 flex gap-1 justify-between">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                          <NavLink
                            to={`/players/${captain[i].player?.id}`}
                            className="underline"
                          >
                            {captain[i].player?.name}
                          </NavLink>
                        </div>
                        <div className="shrink-0 font-semibold">
                          {captain[i].player?.stars}
                        </div>
                      </div>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <table
        className="border border-collapse table-fixed w-full mb-8"
        style={{ minWidth: 80 + 140 * picks[0].length }}
      >
        <tbody>
          {new Array(mostRetains).fill(" ").map((_, i) => (
            <tr key={`Retains ${i}`} className="border">
              <td className="border w-20 p-1">Retains</td>
              {retains.map((retain, j) => (
                <td className="border min-w-24" key={j}>
                  {retain[i] && (
                    <>
                      <div
                        className={twJoin(
                          "font-bold p-1",
                          teamColorText(retain[i].team.color)
                        )}
                        style={{ backgroundColor: retain[i].team.color }}
                      >
                        {teamInitials(retain[i].team.name)}
                      </div>
                      <div className="text-sm p-1 flex gap-1 justify-between">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                          <NavLink
                            to={`/players/${retain[i].player?.id}`}
                            className="underline"
                          >
                            {retain[i].player?.name}
                          </NavLink>
                        </div>
                        <div className="shrink-0 font-semibold">
                          {retain[i].player?.stars}
                        </div>
                      </div>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <table
        className="border border-collapse w-full table-fixed"
        style={{ minWidth: 80 + 140 * picks[0].length }}
      >
        <tbody>
          {picks.map((round, i) => (
            <tr key={`picks ${i}`} className="border">
              <td className="border w-20 p-1">Round {i + 1}</td>
              {round.map((pick, i) => (
                <td className="border" key={i}>
                  {pick && (
                    <>
                      <div
                        className={twJoin(
                          "font-bold p-1",
                          teamColorText(pick.team.color)
                        )}
                        style={{ backgroundColor: pick.team.color }}
                      >
                        {teamInitials(pick.team.name)}
                      </div>
                      <div className="text-sm p-1 flex gap-1 justify-between">
                        <div className="whitespace-nowrap overflow-hidden text-ellipsis min-w-0">
                          <NavLink
                            to={`/players/${pick.player?.id}`}
                            className="underline"
                          >
                            {pick.player?.name ?? "​"}
                          </NavLink>
                        </div>
                        <div className="shrink-0 font-semibold">
                          {pick.player?.stars}
                        </div>
                      </div>
                    </>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

type LoadedPlayer = {
  round: number;
  pick_order: number;
  teamId: number;
  teamName: string;
  color: string;
  playerId: number;
  playerName: string;
  stars: number;
};

type TeamData = {
  team: {
    id: number;
    name: string;
    color: string;
  };
  totalStars: number;
  totalPlayers: number;
  remainingPicksForMinRoster: number;
  maxStarsNext: number;
};

type ParsedPlayer = {
  team: {
    id: number;
    name: string;
    color: string;
  };
  player: {
    id: number;
    name: string;
    stars: number;
  } | null;
};

type Draft = {
  teamData: TeamData[];
  captains: ParsedPlayer[][];
  retains: ParsedPlayer[][];
  picks: ParsedPlayer[][];
};

type DraftQuery = {
  captains: LoadedPlayer[];
  retains: LoadedPlayer[];
  picks: LoadedPlayer[];
  season: {
    min_roster: number;
    max_roster: number;
    max_stars: number;
    r1_stars: number;
  };
};

export async function loader({ params: { season } }: Route.LoaderArgs) {
  const rawData = (await (
    await fetch(`https://mushileague.gg/api/season/${season}/draft`)
  ).json()) as DraftQuery;

  const maxRoundLength = rawData.picks.reduce(
    (accum, item) => Math.max(accum, item.pick_order),
    0
  );

  const picks = rawData.picks.reduce((accum, item) => {
    if (item.round > accum.length) {
      accum.push(new Array(maxRoundLength).fill(undefined));
    }
    accum[item.round - 1][item.pick_order - 1] = {
      team: {
        id: item.teamId,
        name: item.teamName,
        color: item.color,
      },
      player: item.stars
        ? {
            id: item.playerId,
            name: item.playerName,
            stars: +item.stars.toFixed(2),
          }
        : null,
    };
    return accum;
  }, [] as Draft["picks"]);

  const numberOfTeams = picks[0].length;

  const pickOrder = picks[1].reduce((accum, item, i) => {
    accum[item.team.id] = i;
    return accum;
  }, {} as Record<number, number>);

  const captains = rawData.captains
    .sort((a, b) => pickOrder[a.teamId] - pickOrder[b.teamId])
    .reduce((accum, item) => {
      if (!accum[pickOrder[item.teamId]]) {
        accum[pickOrder[item.teamId]] = [];
      }
      accum[pickOrder[item.teamId]].push({
        team: {
          id: item.teamId,
          name: item.teamName,
          color: item.color,
        },
        player: {
          id: item.playerId,
          name: item.playerName,
          stars: +item.stars.toFixed(2),
        },
      });
      return accum;
    }, new Array(numberOfTeams) as Draft["captains"]);

  const retains = rawData.retains
    .sort((a, b) => pickOrder[a.teamId] - pickOrder[b.teamId])
    .reduce((accum, item) => {
      if (!accum[pickOrder[item.teamId]]) {
        accum[pickOrder[item.teamId]] = [];
      }
      accum[pickOrder[item.teamId]].push({
        team: {
          id: item.teamId,
          name: item.teamName,
          color: item.color,
        },
        player: {
          id: item.playerId,
          name: item.playerName,
          stars: +item.stars.toFixed(2),
        },
      });
      return accum;
    }, new Array(numberOfTeams) as Draft["retains"]);

  const teamData = picks[1].map(({ team }, i) => {
    const highestCaptainStars = captains[i][0].player?.stars ?? 0;

    const { totalPlayers, totalStars } = rawData.picks
      .concat(rawData.retains, rawData.captains)
      .reduce(
        (accum, pick) =>
          pick.teamId === team.id
            ? {
                totalPlayers: accum.totalPlayers + 1,
                totalStars: accum.totalStars + pick.stars,
              }
            : accum,
        { totalPlayers: 0, totalStars: 0 }
      );

    const round1PickUpcoming = picks[1][i] === undefined;

    const maxStarsNext = round1PickUpcoming
      ? rawData.season.r1_stars - highestCaptainStars
      : rawData.season.max_stars -
        totalStars -
        (rawData.season.max_roster - totalPlayers - 1) * 1.5;

    const remainingPicksForMinRoster = Math.max(rawData.season.min_roster - totalPlayers, 0);

    return {
      team,
      totalPlayers,
      totalStars,
      maxStarsNext,
      remainingPicksForMinRoster,
    };
  });

  return { picks, captains, retains, teamData };
}
