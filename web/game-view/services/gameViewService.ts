import type {
  ApiGameSummary,
  ApiTeam,
  GameViewFilterData,
  GameViewFilters,
  LastFinalGameItemModel,
  NextGameCardModel,
  UpcomingScheduleItemModel,
} from "../types/gameView";
import {
  getGameById,
  getGameSummaryMobile,
  getGames,
  getOrganizations,
  getSeasons,
  getTeamNextGame,
  getTeams,
  getTeamsByOrganization,
} from "../api/gameViewApi";

const CLOSED_STATUSES = new Set([
  "FINAL",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
  "CANCELED",
  "POSTPONED",
  "PPD",
]);

const FINAL_STATUSES = new Set(["FINAL", "COMPLETED", "CLOSED"]);

const LIVE_STATUS_KEYS = new Set(["LIVE", "INPROGRESS"]);

function toStatusKey(status?: string | null): string {
  return String(status || "")
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, "");
}

function normalizeTeamType(teamType?: string | null): string {
  const value = String(teamType || "").trim().toLowerCase();
  if (value === "girls") return "Girls";
  if (value === "boys") return "Boys";
  return String(teamType || "").trim();
}

function isUpcomingStatus(status?: string | null): boolean {
  return !CLOSED_STATUSES.has(String(status || "SCHEDULED").trim().toUpperCase());
}

function isLiveStatus(status?: string | null): boolean {
  return LIVE_STATUS_KEYS.has(toStatusKey(status));
}

function displayTeamName(team?: ApiTeam) {
  return String(team?.name || "Team").trim() || "Team";
}

function displayTeamNameWithMascot(teamName: string, mascot?: string | null): string {
  const base = String(teamName || "").trim() || "Team";
  const mascotText = String(mascot || "").trim();
  if (!mascotText) return base;
  if (base.toLowerCase().includes(mascotText.toLowerCase())) return base;
  return `${base} ${mascotText}`;
}

function buildTeamContextLabel(team?: ApiTeam): string {
  if (!team) return "";
  const parts = [
    normalizeTeamType(team.teamType),
    String(team.levelName || "").trim(),
  ].filter((value) => Boolean(value));
  return parts.join(" ").trim();
}

function buildMatchupLabel(
  awayTeamName: string,
  homeTeamName: string,
  teamContextLabel?: string,
) {
  const base = `${awayTeamName} at ${homeTeamName}`;
  return teamContextLabel ? `${base} - ${teamContextLabel}` : base;
}

function pickCurrentSeasonId(seasons: Awaited<ReturnType<typeof getSeasons>>) {
  if (!Array.isArray(seasons) || seasons.length === 0) return "";

  const now = new Date();

  const activeInRange = seasons.find((season) => {
    if (!season?.isActive) return false;
    const start = new Date(season.startDate);
    const end = new Date(season.endDate);
    return !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())
      ? start <= now && now <= end
      : false;
  });
  if (activeInRange?.seasonId) return activeInRange.seasonId;

  const anyActive = seasons.find((season) => season?.isActive && season?.seasonId);
  if (anyActive?.seasonId) return anyActive.seasonId;

  const sortedByEnd = [...seasons].sort((a, b) => {
    const aEnd = new Date(a.endDate).getTime();
    const bEnd = new Date(b.endDate).getTime();
    return bEnd - aEnd;
  });
  return sortedByEnd[0]?.seasonId || "";
}

async function loadScopedTeams(filters: GameViewFilters): Promise<{
  seasonId: string;
  teams: ApiTeam[];
}> {
  const [seasons, teamsRaw] = await Promise.all([
    getSeasons(),
    filters.organizationId
      ? getTeamsByOrganization(filters.organizationId)
      : getTeams(),
  ]);

  const seasonId = pickCurrentSeasonId(seasons);

  let teams = Array.isArray(teamsRaw) ? teamsRaw : [];

  if (seasonId) {
    teams = teams.filter((team) => String(team.seasonId || "") === seasonId);
  }

  if (filters.teamType) {
    teams = teams.filter(
      (team) => normalizeTeamType(team.teamType) === filters.teamType,
    );
  }

  if (filters.teamId) {
    teams = teams.filter((team) => String(team.teamId) === filters.teamId);
  }

  return { seasonId, teams };
}

function buildScorePreviewFromSummary(
  summary: ApiGameSummary | null,
  homeTeamName: string,
  awayTeamName: string,
): { homeScore?: number; awayScore?: number } {
  if (!summary) return {};

  const homeKey = homeTeamName.trim().toLowerCase();
  const awayKey = awayTeamName.trim().toLowerCase();
  let homeScore = 0;
  let awayScore = 0;

  for (const goal of summary.goals || []) {
    const teamKey = String(goal.teamName || "").trim().toLowerCase();
    if (teamKey === homeKey) homeScore += 1;
    if (teamKey === awayKey) awayScore += 1;
  }

  return { homeScore, awayScore };
}

export async function fetchFilterData(
  filters?: Partial<GameViewFilters>,
): Promise<GameViewFilterData> {
  const [organizations, scoped] = await Promise.all([
    getOrganizations(),
    loadScopedTeams({
      organizationId: filters?.organizationId || "",
      teamId: "",
      teamType: filters?.teamType || "",
    }),
  ]);

  const organizationOptions = (organizations || [])
    .filter((organization) => organization?.isActive)
    .map((organization) => ({
      id: String(organization.organizationId),
      label:
        String(organization.name || "").trim() ||
        String(organization.abbreviation || "Organization"),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const teamOptions = scoped.teams
    .map((team) => ({
      id: String(team.teamId),
      label: displayTeamNameWithMascot(displayTeamName(team), team.teamMascot),
      teamType: normalizeTeamType(team.teamType),
      seasonId: team.seasonId ? String(team.seasonId) : "",
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    organizations: organizationOptions,
    teams: teamOptions,
  };
}

export async function fetchNextGamesByTeam(
  filters: GameViewFilters,
): Promise<NextGameCardModel[]> {
  const scoped = await loadScopedTeams(filters);
  const teamMap = new Map(scoped.teams.map((team) => [String(team.teamId), team]));
  const filteredTeamIds = new Set(scoped.teams.map((team) => String(team.teamId)));
  const games = await getGames();

  const gameCandidates = (games || [])
    .filter((game) => {
      const homeId = String(game.homeTeamId || "");
      const awayId = String(game.awayTeamId || "");
      if (!filteredTeamIds.has(homeId) && !filteredTeamIds.has(awayId)) return false;

      return isLiveStatus(game.status);
    })
    .sort((a, b) => {
      const aLive = isLiveStatus(a.status) ? 0 : 1;
      const bLive = isLiveStatus(b.status) ? 0 : 1;
      if (aLive !== bLive) return aLive - bLive;
      return new Date(a.gameDateTime).getTime() - new Date(b.gameDateTime).getTime();
    });

  const cardCandidates: Array<NextGameCardModel | null> = await Promise.all(
    gameCandidates.map(async (game) => {
      const gameId = String(game.gameId);
      const status = String(game.status || "SCHEDULED");
      const homeTeam = teamMap.get(String(game.homeTeamId || ""));
      const awayTeam = teamMap.get(String(game.awayTeamId || ""));
      const homeDisplay = displayTeamNameWithMascot(
        String(game.homeTeamName || "Home"),
        homeTeam?.teamMascot || null,
      );
      const awayDisplay = displayTeamNameWithMascot(
        String(game.awayTeamName || "Away"),
        awayTeam?.teamMascot || null,
      );

      let homeScore: number | undefined;
      let awayScore: number | undefined;
      if (isLiveStatus(status)) {
        try {
          const summary = await getGameSummaryMobile(gameId);
          const preview = buildScorePreviewFromSummary(
            summary,
            String(game.homeTeamName || "Home"),
            String(game.awayTeamName || "Away"),
          );
          homeScore = preview.homeScore;
          awayScore = preview.awayScore;
        } catch {
          // Score preview remains optional when summary endpoint fails.
        }
      }

      return {
        gameId,
        teamId: String(game.homeTeamId || ""),
        teamName: homeDisplay,
        opponentName: awayDisplay,
        matchupLabel: buildMatchupLabel(
          awayDisplay,
          homeDisplay,
          buildTeamContextLabel(
            homeTeam || awayTeam,
          ),
        ),
        teamContextLabel: buildTeamContextLabel(
          homeTeam || awayTeam,
        ),
        startTimeIso: new Date(game.gameDateTime).toISOString(),
        status,
        isLive: isLiveStatus(status),
        homeScore,
        awayScore,
      } satisfies NextGameCardModel;
    }),
  );

  const cards = cardCandidates.filter(
    (card): card is NextGameCardModel => card !== null,
  );

  return cards.sort((a, b) => a.startTimeIso.localeCompare(b.startTimeIso));
}

export async function fetchUpcomingSchedule(
  filters: GameViewFilters,
): Promise<UpcomingScheduleItemModel[]> {
  const scoped = await loadScopedTeams(filters);
  const teamMap = new Map(scoped.teams.map((team) => [String(team.teamId), team]));
  const filteredTeamIds = new Set(scoped.teams.map((team) => String(team.teamId)));
  const now = Date.now();

  const games = await getGames();
  return (games || [])
    .filter((game) => {
      const homeId = String(game.homeTeamId || "");
      const awayId = String(game.awayTeamId || "");
      if (!filteredTeamIds.has(homeId) && !filteredTeamIds.has(awayId)) return false;

      const status = String(game.status || "").trim().toUpperCase();
      if (status !== "SCHEDULED") return false;

      const startMs = new Date(game.gameDateTime).getTime();
      if (Number.isNaN(startMs)) return false;

      return startMs >= now;
    })
    .sort(
      (a, b) =>
        new Date(a.gameDateTime).getTime() - new Date(b.gameDateTime).getTime(),
    )
    .map((game) => ({
      homeTeamName: displayTeamNameWithMascot(
        String(game.homeTeamName || "Home"),
        teamMap.get(String(game.homeTeamId || ""))?.teamMascot || null,
      ),
      awayTeamName: displayTeamNameWithMascot(
        String(game.awayTeamName || "Away"),
        teamMap.get(String(game.awayTeamId || ""))?.teamMascot || null,
      ),
      gameId: String(game.gameId),
      startTimeIso: new Date(game.gameDateTime).toISOString(),
      matchupLabel: buildMatchupLabel(
        displayTeamNameWithMascot(
          String(game.awayTeamName || "Away"),
          teamMap.get(String(game.awayTeamId || ""))?.teamMascot || null,
        ),
        displayTeamNameWithMascot(
          String(game.homeTeamName || "Home"),
          teamMap.get(String(game.homeTeamId || ""))?.teamMascot || null,
        ),
        buildTeamContextLabel(
          teamMap.get(String(game.homeTeamId || "")) ||
            teamMap.get(String(game.awayTeamId || "")),
        ),
      ),
      teamContextLabel: buildTeamContextLabel(
        teamMap.get(String(game.homeTeamId || "")) ||
          teamMap.get(String(game.awayTeamId || "")),
      ),
      status: String(game.status || "SCHEDULED"),
    }));
}

export async function fetchLastFinalGamesByTeam(
  filters: GameViewFilters,
): Promise<LastFinalGameItemModel[]> {
  const scoped = await loadScopedTeams(filters);
  const teamMap = new Map(scoped.teams.map((team) => [String(team.teamId), team]));
  const filteredTeamIds = new Set(scoped.teams.map((team) => String(team.teamId)));
  const games = await getGames();

  const finalGames = (games || [])
    .filter((game) => {
      const homeId = String(game.homeTeamId || "");
      const awayId = String(game.awayTeamId || "");
      if (!filteredTeamIds.has(homeId) && !filteredTeamIds.has(awayId)) return false;
      return FINAL_STATUSES.has(String(game.status || "").trim().toUpperCase());
    })
    .sort(
      (a, b) =>
        new Date(b.gameDateTime).getTime() - new Date(a.gameDateTime).getTime(),
    );

  const rows = await Promise.all(
    finalGames.map(async (game) => {
      const homeDisplay = displayTeamNameWithMascot(
        String(game.homeTeamName || "Home"),
        teamMap.get(String(game.homeTeamId || ""))?.teamMascot || null,
      );
      const awayDisplay = displayTeamNameWithMascot(
        String(game.awayTeamName || "Away"),
        teamMap.get(String(game.awayTeamId || ""))?.teamMascot || null,
      );
      let scoreText = "Final score unavailable";
      try {
        const summary = await getGameSummaryMobile(String(game.gameId));
        const score = buildScorePreviewFromSummary(
          summary,
          String(game.homeTeamName || "Home"),
          String(game.awayTeamName || "Away"),
        );
        if (
          typeof score.homeScore === "number" &&
          typeof score.awayScore === "number"
        ) {
          scoreText = `${awayDisplay} ${score.awayScore} - ${score.homeScore} ${homeDisplay}`;
        }
      } catch {
        // Keep fallback score text when summary is unavailable.
      }

      return {
        gameId: String(game.gameId),
        homeTeamName: homeDisplay,
        awayTeamName: awayDisplay,
        matchupLabel: buildMatchupLabel(
          awayDisplay,
          homeDisplay,
          buildTeamContextLabel(
            teamMap.get(String(game.homeTeamId || "")) ||
              teamMap.get(String(game.awayTeamId || "")),
          ),
        ),
        teamContextLabel: buildTeamContextLabel(
          teamMap.get(String(game.homeTeamId || "")) ||
            teamMap.get(String(game.awayTeamId || "")),
        ),
        gameDateIso: new Date(game.gameDateTime).toISOString(),
        status: String(game.status || "FINAL"),
        scoreText,
      } satisfies LastFinalGameItemModel;
    }),
  );

  return rows.sort(
      (a, b) =>
        new Date(b.gameDateIso).getTime() - new Date(a.gameDateIso).getTime(),
    );
}
