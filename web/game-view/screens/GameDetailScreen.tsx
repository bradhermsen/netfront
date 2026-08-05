import React, { useEffect, useMemo, useState } from "react";
import { EventFeed } from "../components/EventFeed";
import { MiniScoreboard } from "../components/MiniScoreboard";
import { RosterTabs, type RosterPlayerRow } from "../components/RosterTabs";
import {
  getGameById,
  getGameSummaryReport,
  getGameShotTotalsFromStats,
  getGameSummaryMobile,
  getTeamCoachesMobile,
  getTeams,
  getTeamRosterMobile,
} from "../api/gameViewApi";
import type { ApiGameSummary, ApiGameSummaryReport, ApiTeamCoach } from "../types/gameView";
import "../styles/game-view.css";

const EVENTS_PAGE_SIZE = 5;
const FINAL_STATUS_KEYS = new Set(["final", "completed", "closed"]);

function readGameIdFromLocation() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("gameId") || "";
}

function readSelectedTeamIdFromLocation() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search);
  return params.get("teamId") || "";
}

function formatEventTime(period?: number, timeInPeriod?: string) {
  if (period && timeInPeriod) {
    return `P${period} ${timeInPeriod}`;
  }
  if (period) return `P${period}`;
  if (timeInPeriod) return timeInPeriod;
  return "Time N/A";
}

function parseClockToSeconds(timeInPeriod?: string): number {
  const raw = String(timeInPeriod || "").trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return -1;
  const minutes = Number(match[1]);
  const seconds = Number(match[2]);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) return -1;
  return minutes * 60 + seconds;
}

function normalizeTeamType(raw?: string | null): string {
  const value = String(raw || "").trim().toLowerCase();
  if (value.startsWith("girl")) return "Girls";
  if (value.startsWith("boy")) return "Boys";
  return "";
}

function withMascot(teamName: string, mascot?: string | null): string {
  const base = String(teamName || "").trim() || "Team";
  const mascotText = String(mascot || "").trim();
  if (!mascotText) return base;
  if (base.toLowerCase().includes(mascotText.toLowerCase())) return base;
  return `${base} ${mascotText}`;
}

function toPeriodToken(period?: number): string {
  if (!period || period <= 0) return "";
  if (period >= 4) return "OT";
  if (period === 1) return "1ST";
  if (period === 2) return "2ND";
  if (period === 3) return "3RD";
  return `${period}TH`;
}

function inferCurrentPeriodFromStatus(statusRaw: string): number | undefined {
  const value = String(statusRaw || "").toLowerCase();
  if (!value) return undefined;

  if (value.includes("ot") || value.includes("overtime")) {
    return 4;
  }

  const periodTokenMatch = value.match(/\b(?:p|period)\s*([1-3])\b/i);
  if (periodTokenMatch) {
    const period = Number(periodTokenMatch[1]);
    if (period >= 1 && period <= 3) return period;
  }

  const ordinalMatch = value.match(/\b([1-3])(st|nd|rd)\b/i);
  if (ordinalMatch) {
    const period = Number(ordinalMatch[1]);
    if (period >= 1 && period <= 3) return period;
  }

  return undefined;
}

function buildScoreFromSummary(
  summary: ApiGameSummary | null,
  homeTeamName: string,
  awayTeamName: string,
) {
  const homeKey = homeTeamName.trim().toLowerCase();
  const awayKey = awayTeamName.trim().toLowerCase();
  let homeScore = 0;
  let awayScore = 0;

  for (const goal of summary?.goals || []) {
    const teamKey = String(goal.teamName || "").trim().toLowerCase();
    if (teamKey === homeKey) homeScore += 1;
    if (teamKey === awayKey) awayScore += 1;
  }

  return { homeScore, awayScore };
}

function buildRosterRows(
  roster: Awaited<ReturnType<typeof getTeamRosterMobile>>,
  summary: ApiGameSummary | null,
  report: ApiGameSummaryReport | null,
  starterIds?: string[],
): RosterPlayerRow[] {
  const goalsByPlayer = new Map<string, number>();
  const assistsByPlayer = new Map<string, number>();
  const penaltyByPlayer = new Map<string, number>();
  const goalieStatsByPlayer = new Map<
    string,
    {
      shotsAgainst: number;
      goalsAgainst: number;
      goalsAgainstAverage: number;
      savePercentage: number;
      minutesPlayed: number;
    }
  >();

  function normalizeName(value: string): string {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function extractLastName(value: string): string {
    const tokens = normalizeName(value).split(" ").filter(Boolean);
    return tokens.length ? tokens[tokens.length - 1] : "";
  }

  const goalieStatsRows: Array<{
    rawName: string;
    normalizedName: string;
    lastName: string;
    stats: {
      shotsAgainst: number;
      goalsAgainst: number;
      goalsAgainstAverage: number;
      savePercentage: number;
      minutesPlayed: number;
    };
  }> = [];

  for (const goal of summary?.goals || []) {
    const scorer = String(goal.scorerName || "").trim().toLowerCase();
    if (scorer) {
      goalsByPlayer.set(scorer, (goalsByPlayer.get(scorer) || 0) + 1);
    }

    const assist1 = String(goal.assist1Name || "").trim().toLowerCase();
    if (assist1) {
      assistsByPlayer.set(assist1, (assistsByPlayer.get(assist1) || 0) + 1);
    }

    const assist2 = String(goal.assist2Name || "").trim().toLowerCase();
    if (assist2) {
      assistsByPlayer.set(assist2, (assistsByPlayer.get(assist2) || 0) + 1);
    }
  }

  for (const penalty of summary?.penalties || []) {
    const key = String(penalty.playerName || "").trim().toLowerCase();
    if (!key) continue;
    const minutes = Number(penalty.durationMinutes || 0);
    penaltyByPlayer.set(key, (penaltyByPlayer.get(key) || 0) + minutes);
  }

  for (const goalie of report?.goalies || []) {
    const rawName = String(goalie.goalieName || "").trim();
    const key = normalizeName(rawName);
    if (!key) continue;

    const shotsAgainst = Number(goalie.total || 0);
    const goalsAgainst = Number(goalie.goalsAgainstEstimate || 0);
    const timeInNetSeconds = Number(goalie.timeInNetSeconds || 0);
    const goalsAgainstAverage =
      timeInNetSeconds > 0 ? (goalsAgainst * 3600) / timeInNetSeconds : 0;
    const minutesPlayed = timeInNetSeconds > 0 ? timeInNetSeconds / 60 : 0;
    const savePercentage =
      shotsAgainst > 0
        ? Number(goalie.savePctEstimate || ((Number(goalie.savesEstimate || 0) * 100) / shotsAgainst))
        : 0;

    const stats = {
      shotsAgainst,
      goalsAgainst,
      goalsAgainstAverage,
      savePercentage,
      minutesPlayed,
    };

    goalieStatsByPlayer.set(key, stats);
    goalieStatsRows.push({
      rawName,
      normalizedName: key,
      lastName: extractLastName(rawName),
      stats,
    });
  }

  return roster
    .filter((player) => player.isActive !== false)
    .map((player) => {
      const fullName = String(player.fullName || "").trim();
      const key = normalizeName(fullName);
      let goalieStats = goalieStatsByPlayer.get(key);

      // Fallback for slight naming differences between roster and goalie summary payloads.
      if (!goalieStats && key) {
        const lastName = extractLastName(fullName);
        if (lastName) {
          const sameLastName = goalieStatsRows.filter((row) => row.lastName === lastName);
          if (sameLastName.length === 1) {
            goalieStats = sameLastName[0].stats;
          } else {
            const loose = goalieStatsRows.find(
              (row) => row.normalizedName.includes(key) || key.includes(row.normalizedName),
            );
            if (loose) goalieStats = loose.stats;
          }
        }
      }
      const normalizedPosition = String(player.position || "").trim().toUpperCase();
      const isGoalie = Boolean(player.isGoalie) || normalizedPosition === "G";
      const isStarter = starterIds ? starterIds.includes(String(player.playerId)) : false;
      return {
        playerId: String(player.playerId),
        playerName: String(player.fullName || "Player"),
        jerseyNumber:
          typeof player.jerseyNumber === "number" ? String(player.jerseyNumber) : "",
        position: String(player.position || "").trim(),
        grade:
          typeof player.grade === "number"
            ? String(player.grade)
            : String(player.grade || "").trim(),
        isGoalie,
        isStarter,
        goals: goalsByPlayer.get(key) || 0,
        assists: assistsByPlayer.get(key) || 0,
        penaltyMinutes: penaltyByPlayer.get(key) || 0,
        shotsAgainst: goalieStats?.shotsAgainst || 0,
        goalsAgainst: goalieStats?.goalsAgainst || 0,
        goalsAgainstAverage: goalieStats?.goalsAgainstAverage || 0,
        savePercentage: goalieStats?.savePercentage || 0,
        minutesPlayed: goalieStats?.minutesPlayed || 0,
      };
    })
    .sort((a, b) => {
      if (a.isGoalie !== b.isGoalie) return a.isGoalie ? 1 : -1;

      const aNumber = Number(a.jerseyNumber);
      const bNumber = Number(b.jerseyNumber);
      const aHasNumber = Number.isFinite(aNumber);
      const bHasNumber = Number.isFinite(bNumber);
      if (aHasNumber && bHasNumber && aNumber !== bNumber) return aNumber - bNumber;
      if (aHasNumber !== bHasNumber) return aHasNumber ? -1 : 1;
      return a.playerName.localeCompare(b.playerName);
    });
}

function isFinalStatus(status?: string): boolean {
  const key = String(status || "")
    .trim()
    .toLowerCase();
  return FINAL_STATUS_KEYS.has(key);
}

function formatNumberAndName(numberValue: number | null | undefined, name: string): string {
  const player = String(name || "").trim() || "Unknown";
  if (typeof numberValue === "number" && Number.isFinite(numberValue)) {
    return `#${numberValue} ${player}`;
  }
  return player;
}

function formatVenue(arenaName: string, rinkName: string): string {
  const arena = String(arenaName || "").trim();
  const rink = String(rinkName || "").trim();
  if (arena && rink) return `${arena} - ${rink}`;
  return arena || rink || "Venue not recorded";
}

export function GameDetailScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [gameTitle, setGameTitle] = useState("");
  const [periodLabel, setPeriodLabel] = useState("Period -");
  const [statusLabel, setStatusLabel] = useState("Scheduled");
  const [isInProgress, setIsInProgress] = useState(false);
  const [homeTeamName, setHomeTeamName] = useState("Home");
  const [awayTeamName, setAwayTeamName] = useState("Away");
  const [homeTeamDisplayName, setHomeTeamDisplayName] = useState("Home");
  const [awayTeamDisplayName, setAwayTeamDisplayName] = useState("Away");
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);
  const [homeShots, setHomeShots] = useState(0);
  const [awayShots, setAwayShots] = useState(0);
  const [homeShotsP1, setHomeShotsP1] = useState<number | undefined>(undefined);
  const [homeShotsP2, setHomeShotsP2] = useState<number | undefined>(undefined);
  const [homeShotsP3, setHomeShotsP3] = useState<number | undefined>(undefined);
  const [awayShotsP1, setAwayShotsP1] = useState<number | undefined>(undefined);
  const [awayShotsP2, setAwayShotsP2] = useState<number | undefined>(undefined);
  const [awayShotsP3, setAwayShotsP3] = useState<number | undefined>(undefined);
  const [currentPeriodNumber, setCurrentPeriodNumber] = useState<number | undefined>(undefined);
  const [activeRosterTab, setActiveRosterTab] = useState<"home" | "away">("home");
  const [homeRoster, setHomeRoster] = useState<RosterPlayerRow[]>([]);
  const [awayRoster, setAwayRoster] = useState<RosterPlayerRow[]>([]);
  const [homeCoaches, setHomeCoaches] = useState<ApiTeamCoach[]>([]);
  const [awayCoaches, setAwayCoaches] = useState<ApiTeamCoach[]>([]);
  const [eventPage, setEventPage] = useState(1);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [events, setEvents] = useState<
    Array<{ eventId: string; eventType: "goal" | "penalty" | "shot"; description: string; createdAtIso: string }>
  >([]);
  const [summaryReport, setSummaryReport] = useState<ApiGameSummaryReport | null>(null);
  const [goalieStatsNotice, setGoalieStatsNotice] = useState("");

  const gameId = useMemo(() => readGameIdFromLocation(), []);
  const selectedTeamId = useMemo(() => readSelectedTeamIdFromLocation(), []);

  function handleBackToMain() {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("gameId");
    const query = params.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}`;
    window.location.assign(nextUrl);
  }

  useEffect(() => {
    let cancelled = false;
    const isBackgroundRefresh = refreshNonce > 0;

    async function load() {
      if (!gameId) {
        setErrorMessage("Missing gameId in URL.");
        setIsLoading(false);
        return;
      }

      if (!isBackgroundRefresh) {
        setIsLoading(true);
        setErrorMessage("");
      }

      try {
        const game = await getGameById(gameId);
        const [
          summary,
          teams,
          shotTotalsFromStats,
          homeRosterRaw,
          awayRosterRaw,
          homeCoachesRaw,
          awayCoachesRaw,
          reportResult,
        ] = await Promise.all([
          getGameSummaryMobile(gameId),
          getTeams(),
          getGameShotTotalsFromStats(gameId).catch(() => null),
          getTeamRosterMobile(String(game.homeTeamId)),
          getTeamRosterMobile(String(game.awayTeamId)),
          getTeamCoachesMobile(String(game.homeTeamId)).catch(() => []),
          getTeamCoachesMobile(String(game.awayTeamId)).catch(() => []),
          getGameSummaryReport(gameId)
            .then((report) => ({ ok: true as const, report }))
            .catch(() => ({ ok: false as const, report: null })),
        ]);

        if (cancelled) return;

        const nextHomeName = String(game.homeTeamName || "Home");
        const nextAwayName = String(game.awayTeamName || "Away");
        setHomeTeamName(nextHomeName);
        setAwayTeamName(nextAwayName);

        const homeTeamMeta = teams.find((team) => String(team.teamId) === String(game.homeTeamId));
        const awayTeamMeta = teams.find((team) => String(team.teamId) === String(game.awayTeamId));
        const nextHomeDisplay = withMascot(nextHomeName, homeTeamMeta?.teamMascot || null);
        const nextAwayDisplay = withMascot(nextAwayName, awayTeamMeta?.teamMascot || null);
        setHomeTeamDisplayName(nextHomeDisplay);
        setAwayTeamDisplayName(nextAwayDisplay);
        const typeLabel = normalizeTeamType(homeTeamMeta?.teamType) || normalizeTeamType(awayTeamMeta?.teamType);
        const levelLabel = String(homeTeamMeta?.levelName || awayTeamMeta?.levelName || "").trim();
        const detailSuffix = [typeLabel, levelLabel].filter(Boolean).join(" ").trim();

        setGameTitle(
          detailSuffix
            ? `${nextAwayDisplay} at ${nextHomeDisplay} - ${detailSuffix}`
            : `${nextAwayDisplay} at ${nextHomeDisplay}`,
        );

        const periodCandidates = [
          ...(summary?.goals?.map((goal) => Number(goal.period)) || []),
          ...(summary?.penalties?.map((penalty) => Number(penalty.period)) || []),
        ].filter((period) => Number.isFinite(period) && period > 0);
        const maxPeriodFromEvents = periodCandidates.length ? Math.max(...periodCandidates) : undefined;
        const maxPeriodFromShots = [
          summary?.homeShotsP1,
          summary?.awayShotsP1,
          summary?.homeShotsP2,
          summary?.awayShotsP2,
          summary?.homeShotsP3,
          summary?.awayShotsP3,
        ].some((value) => typeof value === "number")
          ? [
              typeof summary?.homeShotsP3 === "number" || typeof summary?.awayShotsP3 === "number" ? 3 : 0,
              typeof summary?.homeShotsP2 === "number" || typeof summary?.awayShotsP2 === "number" ? 2 : 0,
              typeof summary?.homeShotsP1 === "number" || typeof summary?.awayShotsP1 === "number" ? 1 : 0,
            ].find((period) => period > 0)
          : undefined;

        const statusRaw = String(game.status || "SCHEDULED");
        const statusKey = statusRaw.toLowerCase();
        const isIntermission = statusKey.includes("intermission");
        const isInProgress =
          statusKey.includes("in progress") ||
          statusKey.includes("in_progress") ||
          statusKey.includes("live") ||
          statusKey.includes("ongoing");
        setIsInProgress(isInProgress);
        setStatusLabel(
          isIntermission ? "Intermission" : isInProgress ? "In Progress" : statusRaw,
        );

        const currentFromStatus = inferCurrentPeriodFromStatus(statusRaw);
        const resolvedCurrentPeriod =
          maxPeriodFromEvents ||
          maxPeriodFromShots ||
          currentFromStatus ||
          (isInProgress ? 1 : undefined);
        setCurrentPeriodNumber(resolvedCurrentPeriod);
        setPeriodLabel(toPeriodToken(resolvedCurrentPeriod));

        const score = buildScoreFromSummary(summary, nextHomeName, nextAwayName);
        setHomeScore(score.homeScore);
        setAwayScore(score.awayScore);

        setHomeShots(
          typeof summary?.homeShots === "number"
            ? summary.homeShots
            : typeof shotTotalsFromStats?.homeShots === "number"
              ? shotTotalsFromStats.homeShots
              : score.homeScore,
        );
        setAwayShots(
          typeof summary?.awayShots === "number"
            ? summary.awayShots
            : typeof shotTotalsFromStats?.awayShots === "number"
              ? shotTotalsFromStats.awayShots
              : score.awayScore,
        );
        setHomeShotsP1(summary?.homeShotsP1);
        setHomeShotsP2(summary?.homeShotsP2);
        setHomeShotsP3(summary?.homeShotsP3);
        setAwayShotsP1(summary?.awayShotsP1);
        setAwayShotsP2(summary?.awayShotsP2);
        setAwayShotsP3(summary?.awayShotsP3);

        if (selectedTeamId) {
          const selected = selectedTeamId.trim().toLowerCase();
          const homeId = String(game.homeTeamId || "").trim().toLowerCase();
          const awayId = String(game.awayTeamId || "").trim().toLowerCase();
          if (selected === awayId) {
            setActiveRosterTab("away");
          } else if (selected === homeId) {
            setActiveRosterTab("home");
          }
        }

        const report = reportResult.report;
        setHomeRoster(buildRosterRows(homeRosterRaw, summary, report, summary?.homeStarterIds));
        setAwayRoster(buildRosterRows(awayRosterRaw, summary, report, summary?.awayStarterIds));
        setHomeCoaches(homeCoachesRaw);
        setAwayCoaches(awayCoachesRaw);
        setSummaryReport(report);

        if (!reportResult.ok) {
          setGoalieStatsNotice("Goalie stats are unavailable right now because the game summary report could not be loaded.");
        } else if (!report) {
          setGoalieStatsNotice("Goalie stats are unavailable for this game because no saved game summary report was found.");
        } else if ((report.goalies || []).length === 0) {
          setGoalieStatsNotice("Goalie stats are unavailable for this game because no goalie summary data was submitted.");
        } else {
          setGoalieStatsNotice("");
        }

        const mappedEvents = [
          ...(summary?.goals || []).map((goal) => ({
            eventId: `goal-${goal.eventId}`,
            eventType: "goal" as const,
            description: (() => {
              const scorer = goal.scorerName || "Goal";
              const assists = [goal.assist1Name, goal.assist2Name]
                .map((name) => String(name || "").trim())
                .filter((name) => Boolean(name));
              if (assists.length === 0) {
                return `${goal.teamName}: ${scorer}`;
              }
              return `${goal.teamName}: ${scorer} (A: ${assists.join(", ")})`;
            })(),
            createdAtIso: formatEventTime(goal.period, goal.timeInPeriod),
            sortPeriod: Number(goal.period) || 0,
            sortTimeSeconds: parseClockToSeconds(goal.timeInPeriod),
          })),
          ...(summary?.penalties || []).map((penalty) => ({
            eventId: `penalty-${penalty.eventId}`,
            eventType: "penalty" as const,
            description: `${penalty.teamName}: ${penalty.playerName} (${penalty.infraction})`,
            createdAtIso: formatEventTime(penalty.period, penalty.timeInPeriod),
            sortPeriod: Number(penalty.period) || 0,
            sortTimeSeconds: parseClockToSeconds(penalty.timeInPeriod),
          })),
        ]
          .sort((a, b) => {
            const periodDiff = b.sortPeriod - a.sortPeriod;
            if (periodDiff !== 0) return periodDiff;
            return b.sortTimeSeconds - a.sortTimeSeconds;
          })
          .map(({ sortPeriod: _sortPeriod, sortTimeSeconds: _sortTimeSeconds, ...event }) => event);

        setEvents(mappedEvents);
        if (!isBackgroundRefresh) {
          setEventPage(1);
        }
      } catch (error) {
        if (cancelled) return;
        if (!isBackgroundRefresh) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load game detail.",
          );
        }
      } finally {
        if (!cancelled && !isBackgroundRefresh) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [gameId, selectedTeamId, refreshNonce]);

  useEffect(() => {
    if (!gameId || !isInProgress) {
      return;
    }

    const timer = setInterval(() => {
      setRefreshNonce((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(timer);
  }, [gameId, isInProgress]);

  const eventTotalPages = Math.max(1, Math.ceil(events.length / EVENTS_PAGE_SIZE));
  const pagedEvents = useMemo(() => {
    const safePage = Math.min(eventPage, eventTotalPages);
    const start = (safePage - 1) * EVENTS_PAGE_SIZE;
    return events.slice(start, start + EVENTS_PAGE_SIZE);
  }, [eventPage, eventTotalPages, events]);

  useEffect(() => {
    setEventPage((prev) => Math.min(prev, eventTotalPages));
  }, [eventTotalPages]);

  return (
    <main className="game-view-root">
      <header className="game-view-header">
        <button
          type="button"
          className="game-view-menu-button game-view-back-button"
          onClick={handleBackToMain}
          aria-label="Back to GameView"
        >
          Back to GameView
        </button>

        <div className="game-view-brand">
          <img
            src="/NF_Logo_Default.png"
            alt="NetFront"
            className="game-view-logo"
          />
          <h1 className="game-view-title">NetFront GameView</h1>
        </div>

        <p className="game-view-subtitle">{gameTitle || "Loading matchup..."}</p>
      </header>

      <div className="game-view-header-separator" aria-hidden="true" />

      {errorMessage ? <p className="game-view-error">{errorMessage}</p> : null}

      {isLoading ? (
        <p className="game-view-loading">Loading game detail...</p>
      ) : (
        <>
          <section className="game-view-section">
            <MiniScoreboard
              awayTeam={awayTeamDisplayName}
              homeTeam={homeTeamDisplayName}
              awayScore={awayScore}
              homeScore={homeScore}
              awayShots={awayShots}
              homeShots={homeShots}
              awayShotsP1={awayShotsP1}
              awayShotsP2={awayShotsP2}
              awayShotsP3={awayShotsP3}
              homeShotsP1={homeShotsP1}
              homeShotsP2={homeShotsP2}
              homeShotsP3={homeShotsP3}
              currentPeriodNumber={currentPeriodNumber}
              periodLabel={periodLabel}
              statusLabel={statusLabel}
              isInProgress={isInProgress}
            />
          </section>

          <section className="game-view-section">
            <EventFeed
              events={pagedEvents}
              currentPage={Math.min(eventPage, eventTotalPages)}
              totalPages={eventTotalPages}
              onPageChange={(page) => setEventPage(Math.max(1, Math.min(page, eventTotalPages)))}
            />
          </section>

          {summaryReport && isFinalStatus(summaryReport.status) ? (
            <section className="game-view-section">
              <article className="game-view-summary-report-card">
                <h2 className="game-view-section-title">Official Game Summary</h2>

                <div className="game-view-summary-meta-grid">
                  <p>
                    <strong>Final Score:</strong> {summaryReport.awayTeamName} {summaryReport.awayGoals} - {summaryReport.homeGoals} {summaryReport.homeTeamName}
                  </p>
                  <p><strong>Date:</strong> {new Date(summaryReport.gameDateTime).toLocaleString()}</p>
                  <p><strong>League:</strong> {summaryReport.leagueName || "N/A"}</p>
                  <p><strong>Team Type:</strong> {summaryReport.teamType || "N/A"}</p>
                  <p><strong>Level:</strong> {summaryReport.homeLevelName || summaryReport.awayLevelName || "N/A"}</p>
                  <p><strong>Venue:</strong> {formatVenue(summaryReport.arenaName, summaryReport.rinkName)}</p>
                  <p><strong>Season:</strong> {summaryReport.seasonName || "N/A"}</p>
                </div>

                <div className="game-view-summary-subsection">
                  <h3 className="game-view-summary-subtitle">Goals</h3>
                  {summaryReport.goals.length === 0 ? (
                    <p className="game-view-empty-text">No goals recorded.</p>
                  ) : (
                    <ul className="game-view-summary-list">
                      {summaryReport.goals.map((goal, idx) => (
                        <li key={`${goal.period}-${goal.timeInPeriod}-${goal.teamName}-${idx}`}>
                          P{goal.period} {goal.timeInPeriod} - {goal.teamName}: {formatNumberAndName(goal.scorerNumber, goal.scorer)}
                          {goal.assist1
                            ? ` (A: ${formatNumberAndName(goal.assist1Number, goal.assist1)}${goal.assist2 ? `, ${formatNumberAndName(goal.assist2Number, goal.assist2)}` : ""})`
                            : ""}
                          {goal.strength ? ` - ${goal.strength}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="game-view-summary-subsection">
                  <h3 className="game-view-summary-subtitle">Penalties</h3>
                  {summaryReport.penalties.length === 0 ? (
                    <p className="game-view-empty-text">No penalties recorded.</p>
                  ) : (
                    <ul className="game-view-summary-list">
                      {summaryReport.penalties.map((penalty, idx) => (
                        <li key={`${penalty.period}-${penalty.timeInPeriod}-${penalty.playerName}-${idx}`}>
                          P{penalty.period} {penalty.timeInPeriod} - {penalty.teamName}: {formatNumberAndName(penalty.playerNumber, penalty.playerName)}
                          {` (${penalty.infraction}, ${penalty.durationMinutes} min${penalty.penaltyType ? `, ${penalty.penaltyType}` : ""})`}
                          {penalty.notes ? ` - Notes: ${penalty.notes}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="game-view-summary-subsection">
                  <h3 className="game-view-summary-subtitle">Goalie Shots By Period</h3>
                  {summaryReport.goalies.length === 0 ? (
                    <p className="game-view-empty-text">No goalie shot breakdown recorded.</p>
                  ) : (
                    <ul className="game-view-summary-list">
                      {summaryReport.goalies.map((goalie, idx) => (
                        <li key={`${goalie.teamName}-${goalie.goalieName}-${idx}`}>
                          {goalie.teamName}: {goalie.goalieName} (P1 {goalie.p1}, P2 {goalie.p2}, P3 {goalie.p3}, OT {goalie.ot}, Total {goalie.total})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="game-view-summary-subsection">
                  <h3 className="game-view-summary-subtitle">Officials</h3>
                  {summaryReport.officials.length === 0 ? (
                    <p className="game-view-empty-text">No officials recorded.</p>
                  ) : (
                    <ul className="game-view-summary-list">
                      {summaryReport.officials.map((official, idx) => (
                        <li key={`${official.role}-${official.officialName}-${idx}`}>
                          {official.role}: {official.officialName || "Unassigned"}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="game-view-summary-subsection">
                  <h3 className="game-view-summary-subtitle">Suspension Reviews</h3>
                  {summaryReport.suspensionReviews.length === 0 ? (
                    <p className="game-view-empty-text">No suspension review items.</p>
                  ) : (
                    <ul className="game-view-summary-list">
                      {summaryReport.suspensionReviews.map((item, idx) => (
                        <li key={`${item.period}-${item.timeInPeriod}-${item.playerName}-${idx}`}>
                          P{item.period} {item.timeInPeriod} - {item.teamName}: {formatNumberAndName(item.playerNumber, item.playerName)}
                          {item.suspensionBehavior ? ` (${item.suspensionBehavior})` : ""}
                          {item.reviewRequired ? " - Review Required" : ""}
                          {item.requiresRefereeNotes ? " - Ref Notes Required" : ""}
                          {item.notes ? ` - Notes: ${item.notes}` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </article>
            </section>
          ) : null}

          <section className="game-view-section">
            <RosterTabs
              homeTeamName={homeTeamDisplayName}
              awayTeamName={awayTeamDisplayName}
              homeRoster={homeRoster}
              awayRoster={awayRoster}
              homeCoaches={homeCoaches}
              awayCoaches={awayCoaches}
              activeTab={activeRosterTab}
              onTabChange={setActiveRosterTab}
              goalieStatsNotice={goalieStatsNotice}
            />
          </section>
        </>
      )}
    </main>
  );
}
