import type {
  ApiGameDetail,
  ApiGameListItem,
  ApiRosterPlayer,
  ApiGameSummary,
  ApiNextGame,
  ApiOrganization,
  ApiTeamCoach,
  ApiSeason,
  ApiTeam,
} from "../types/gameView";

type RequestOptions = Omit<RequestInit, "headers"> & {
  headers?: Record<string, string>;
};

type JsonObject = Record<string, unknown>;

function asObject(value: unknown): JsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as JsonObject;
}

function pickString(obj: JsonObject, ...keys: string[]): string {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function pickBoolean(obj: JsonObject, ...keys: string[]): boolean {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return false;
}

function pickOptionalBoolean(obj: JsonObject, ...keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return undefined;
}

function pickOptionalNumber(obj: JsonObject, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function pickNumber(obj: JsonObject, ...keys: string[]): number {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }
  return 0;
}

function extractListPayload(payload: unknown, label: string): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  const obj = asObject(payload);
  if (!obj) {
    throw new Error(`${label} response was not a list.`);
  }

  const errorMessage = pickString(obj, "error", "Error", "message", "Message");
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  for (const key of ["items", "Items", "data", "Data", "results", "Results"]) {
    const value = obj[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function normalizeOrganization(row: unknown): ApiOrganization {
  const obj = asObject(row) || {};
  return {
    organizationId: pickString(obj, "organizationId", "OrganizationId"),
    name: pickString(obj, "name", "Name") || null,
    abbreviation: pickString(obj, "abbreviation", "Abbreviation") || null,
    mascot: pickString(obj, "mascot", "Mascot") || null,
    isActive: pickBoolean(obj, "isActive", "IsActive"),
  };
}

function normalizeTeam(row: unknown): ApiTeam {
  const obj = asObject(row) || {};
  return {
    teamId: pickString(obj, "teamId", "TeamId", "id", "Id"),
    organizationId:
      pickString(obj, "organizationId", "OrganizationId") || null,
    seasonId: pickString(obj, "seasonId", "SeasonId") || null,
    name: pickString(obj, "name", "Name") || null,
    teamType: pickString(obj, "teamType", "TeamType") || null,
    levelName: pickString(obj, "levelName", "LevelName") || null,
    teamMascot: pickString(obj, "teamMascot", "TeamMascot") || null,
    isActive: pickBoolean(obj, "isActive", "IsActive"),
  };
}

function normalizeSeason(row: unknown): ApiSeason {
  const obj = asObject(row) || {};
  return {
    seasonId: pickString(obj, "seasonId", "SeasonId"),
    seasonName: pickString(obj, "seasonName", "SeasonName") || null,
    startDate: pickString(obj, "startDate", "StartDate"),
    endDate: pickString(obj, "endDate", "EndDate"),
    isActive: pickBoolean(obj, "isActive", "IsActive"),
  };
}

function normalizeGameListItem(row: unknown): ApiGameListItem {
  const obj = asObject(row) || {};
  return {
    gameId: pickString(obj, "gameId", "GameId"),
    homeTeamId: pickString(obj, "homeTeamId", "HomeTeamId"),
    homeTeamName: pickString(obj, "homeTeamName", "HomeTeamName"),
    awayTeamId: pickString(obj, "awayTeamId", "AwayTeamId"),
    awayTeamName: pickString(obj, "awayTeamName", "AwayTeamName"),
    gameDateTime: pickString(obj, "gameDateTime", "GameDateTime"),
    status: pickString(obj, "status", "Status") || "SCHEDULED",
  };
}

function normalizeGameDetail(payload: unknown): ApiGameDetail {
  const obj = asObject(payload) || {};
  const errorMessage = pickString(obj, "error", "Error", "message", "Message");
  if (errorMessage) {
    throw new Error(errorMessage);
  }

  return {
    gameId: pickString(obj, "gameId", "GameId"),
    homeTeamId: pickString(obj, "homeTeamId", "HomeTeamId"),
    homeTeamName: pickString(obj, "homeTeamName", "HomeTeamName"),
    awayTeamId: pickString(obj, "awayTeamId", "AwayTeamId"),
    awayTeamName: pickString(obj, "awayTeamName", "AwayTeamName"),
    gameDateTime: pickString(obj, "gameDateTime", "GameDateTime"),
    status: pickString(obj, "status", "Status") || "SCHEDULED",
    periodLengthMinutes: pickNumber(obj, "periodLengthMinutes", "PeriodLengthMinutes"),
  };
}

function normalizeNextGame(payload: unknown): ApiNextGame {
  const obj = asObject(payload) || {};
  return {
    gameId: pickString(obj, "gameId", "GameId"),
    homeTeamId: pickString(obj, "homeTeamId", "HomeTeamId"),
    homeTeamName: pickString(obj, "homeTeamName", "HomeTeamName"),
    awayTeamId: pickString(obj, "awayTeamId", "AwayTeamId"),
    awayTeamName: pickString(obj, "awayTeamName", "AwayTeamName"),
    opponentName: pickString(obj, "opponentName", "OpponentName"),
    startTime: pickString(obj, "startTime", "StartTime"),
    teamType: pickString(obj, "teamType", "TeamType") || null,
    levelName: pickString(obj, "levelName", "LevelName") || null,
    homeTeamMascot: pickString(obj, "homeTeamMascot", "HomeTeamMascot") || null,
    awayTeamMascot: pickString(obj, "awayTeamMascot", "AwayTeamMascot") || null,
  };
}

function normalizeGameSummary(payload: unknown): ApiGameSummary {
  const obj = asObject(payload) || {};
  const goalsRaw = extractListPayload(obj.goals ?? obj.Goals ?? [], "goals");
  const penaltiesRaw = extractListPayload(
    obj.penalties ?? obj.Penalties ?? [],
    "penalties",
  );

  return {
    gameId: pickString(obj, "gameId", "GameId"),
    goals: goalsRaw.map((row) => {
      const goal = asObject(row) || {};
      return {
        eventId: pickString(goal, "eventId", "EventId"),
        period: pickNumber(goal, "period", "Period") || undefined,
        timeInPeriod: pickString(goal, "timeInPeriod", "TimeInPeriod") || undefined,
        teamName: pickString(goal, "teamName", "TeamName"),
        scorerName: pickString(goal, "scorerName", "ScorerName") || undefined,
        assist1Name: pickString(goal, "assist1Name", "Assist1Name") || null,
        assist2Name: pickString(goal, "assist2Name", "Assist2Name") || null,
      };
    }),
    penalties: penaltiesRaw.map((row) => {
      const penalty = asObject(row) || {};
      return {
        eventId: pickString(penalty, "eventId", "EventId"),
        period: pickNumber(penalty, "period", "Period") || undefined,
        timeInPeriod:
          pickString(penalty, "timeInPeriod", "TimeInPeriod") || undefined,
        teamName: pickString(penalty, "teamName", "TeamName"),
        playerName: pickString(penalty, "playerName", "PlayerName"),
        infraction: pickString(penalty, "infraction", "Infraction"),
        durationMinutes: pickNumber(
          penalty,
          "durationMinutes",
          "DurationMinutes",
        ),
      };
    }),
    homeShotsP1: pickOptionalNumber(obj, "homeShotsP1", "HomeShotsP1"),
    homeShotsP2: pickOptionalNumber(obj, "homeShotsP2", "HomeShotsP2"),
    homeShotsP3: pickOptionalNumber(obj, "homeShotsP3", "HomeShotsP3"),
    homeShotsOT: pickOptionalNumber(obj, "homeShotsOT", "HomeShotsOT"),
    homeShots: pickOptionalNumber(obj, "homeShots", "HomeShots"),
    awayShotsP1: pickOptionalNumber(obj, "awayShotsP1", "AwayShotsP1"),
    awayShotsP2: pickOptionalNumber(obj, "awayShotsP2", "AwayShotsP2"),
    awayShotsP3: pickOptionalNumber(obj, "awayShotsP3", "AwayShotsP3"),
    awayShotsOT: pickOptionalNumber(obj, "awayShotsOT", "AwayShotsOT"),
    awayShots: pickOptionalNumber(obj, "awayShots", "AwayShots"),
    homeOnPowerPlay: pickOptionalBoolean(
      obj,
      "homeOnPowerPlay",
      "HomeOnPowerPlay",
      "isHomeOnPowerPlay",
      "IsHomeOnPowerPlay",
    ),
    awayOnPowerPlay: pickOptionalBoolean(
      obj,
      "awayOnPowerPlay",
      "AwayOnPowerPlay",
      "isAwayOnPowerPlay",
      "IsAwayOnPowerPlay",
    ),
  };
}

function normalizeRosterPlayers(payload: unknown): ApiRosterPlayer[] {
  return extractListPayload(payload, "roster").map((row) => {
    const obj = asObject(row) || {};
    const gradeNumber = pickOptionalNumber(obj, "grade", "Grade");
    const gradeText = pickString(obj, "grade", "Grade");
    return {
      playerId: pickString(obj, "playerId", "PlayerId"),
      fullName: pickString(obj, "fullName", "FullName"),
      jerseyNumber: pickNumber(obj, "jerseyNumber", "JerseyNumber") || null,
      grade:
        typeof gradeNumber === "number"
          ? gradeNumber
          : gradeText || null,
      isActive: pickBoolean(obj, "isActive", "IsActive"),
    };
  });
}

function normalizeTeamCoaches(payload: unknown): ApiTeamCoach[] {
  return extractListPayload(payload, "coaches").map((row) => {
    const obj = asObject(row) || {};
    return {
      roleName: pickString(obj, "roleName", "RoleName") || "Coach",
      coachName: pickString(obj, "coachName", "CoachName") || "Unknown Coach",
      coachEmail: pickString(obj, "coachEmail", "CoachEmail") || null,
    };
  });
}

function resolveApiBase() {
  const globalBase =
    typeof window !== "undefined" && typeof window.apiBase === "string"
      ? window.apiBase
      : "/api";
  return String(globalBase || "/api").replace(/\/$/, "");
}

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${resolveApiBase()}${normalizedPath}`;
}

async function authFetch(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };

  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("nf_gameview_token") ||
        localStorage.getItem("nf_token") ||
        localStorage.getItem("nf_admin_token")
      : null;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(buildApiUrl(path), {
    ...options,
    headers,
  });
}

async function getJson<T>(path: string): Promise<T> {
  const res = await authFetch(path);
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for ${path}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (!/application\/json/i.test(contentType)) {
    const preview = (await res.text()).slice(0, 120);
    throw new Error(
      `Expected JSON from ${path} but received ${contentType || "unknown content-type"}. Preview: ${preview}`,
    );
  }

  return (await res.json()) as T;
}

export async function getOrganizations(): Promise<ApiOrganization[]> {
  const payload = await getJson<unknown>("/organizations");
  return extractListPayload(payload, "organizations").map(normalizeOrganization);
}

export async function getTeams(): Promise<ApiTeam[]> {
  const payload = await getJson<unknown>("/teams");
  return extractListPayload(payload, "teams").map(normalizeTeam);
}

export async function getTeamsByOrganization(
  organizationId: string,
): Promise<ApiTeam[]> {
  const payload = await getJson<unknown>(`/teams/by-organization/${organizationId}`);
  return extractListPayload(payload, "teams").map(normalizeTeam);
}

export async function getSeasons(): Promise<ApiSeason[]> {
  const payload = await getJson<unknown>("/seasons");
  return extractListPayload(payload, "seasons").map(normalizeSeason);
}

export async function getGames(): Promise<ApiGameListItem[]> {
  const payload = await getJson<unknown>("/games");
  return extractListPayload(payload, "games").map(normalizeGameListItem);
}

export async function getGameById(gameId: string): Promise<ApiGameDetail> {
  const payload = await getJson<unknown>(`/games/${gameId}`);
  return normalizeGameDetail(payload);
}

export async function getTeamNextGame(teamId: string): Promise<ApiNextGame | null> {
  const res = await authFetch(`/teams/${teamId}/nextgame`);

  if (res.status === 404 || res.status === 410) {
    return null;
  }

  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for /teams/${teamId}/nextgame`);
  }

  return normalizeNextGame(await res.json());
}

export async function getGameSummaryMobile(
  gameId: string,
): Promise<ApiGameSummary | null> {
  const res = await authFetch(`/games/${gameId}/summary-mobile`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for /games/${gameId}/summary-mobile`);
  }
  return normalizeGameSummary(await res.json());
}

export async function getGameShotTotalsFromStats(
  gameId: string,
): Promise<{ homeShots: number; awayShots: number } | null> {
  const payload = await getJson<unknown>(`/stats/game?gameId=${encodeURIComponent(gameId)}`);
  const rows = extractListPayload(payload, "game stats");
  const first = asObject(rows[0]);
  if (!first) return null;

  return {
    homeShots: pickNumber(first, "homeShots", "HomeShots"),
    awayShots: pickNumber(first, "awayShots", "AwayShots"),
  };
}

export async function getTeamRosterMobile(
  teamId: string,
): Promise<ApiRosterPlayer[]> {
  const res = await authFetch(`/teams/${teamId}/roster-mobile`);
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for /teams/${teamId}/roster-mobile`);
  }
  return normalizeRosterPlayers(await res.json());
}

export async function getTeamCoachesMobile(
  teamId: string,
): Promise<ApiTeamCoach[]> {
  const res = await authFetch(`/teams/${teamId}/coaches-mobile`);
  if (res.status === 404) {
    return [];
  }
  if (!res.ok) {
    throw new Error(`Request failed (${res.status}) for /teams/${teamId}/coaches-mobile`);
  }
  return normalizeTeamCoaches(await res.json());
}

declare global {
  interface Window {
    apiBase?: string;
  }
}
