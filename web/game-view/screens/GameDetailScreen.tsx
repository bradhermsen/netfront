import React, { useEffect, useMemo, useState } from "react";
import { EventFeed } from "../components/EventFeed";
import { MiniScoreboard } from "../components/MiniScoreboard";
import { RosterTabs, type RosterPlayerRow } from "../components/RosterTabs";
import {
  getGameById,
  getGameShotTotalsFromStats,
  getGameSummaryMobile,
  getTeamCoachesMobile,
  getTeams,
  getTeamRosterMobile,
} from "../api/gameViewApi";
import type { ApiGameSummary, ApiTeamCoach } from "../types/gameView";
import "../styles/game-view.css";

const EVENTS_PAGE_SIZE = 5;

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

function inferPowerPlay(
  summary: ApiGameSummary | null,
  homeTeamName: string,
  awayTeamName: string,
  isInProgress: boolean,
): { homePowerPlay: boolean; awayPowerPlay: boolean } {
  if (typeof summary?.homeOnPowerPlay === "boolean" || typeof summary?.awayOnPowerPlay === "boolean") {
    return {
      homePowerPlay: Boolean(summary?.homeOnPowerPlay),
      awayPowerPlay: Boolean(summary?.awayOnPowerPlay),
    };
  }

  if (!isInProgress || !summary?.penalties?.length) {
    return { homePowerPlay: false, awayPowerPlay: false };
  }

  const latestPenalty = [...summary.penalties].sort((a, b) => {
    const periodDiff = (Number(b.period) || 0) - (Number(a.period) || 0);
    if (periodDiff !== 0) return periodDiff;
    return parseClockToSeconds(b.timeInPeriod) - parseClockToSeconds(a.timeInPeriod);
  })[0];

  const penalized = String(latestPenalty?.teamName || "").trim().toLowerCase();
  const homeKey = homeTeamName.trim().toLowerCase();
  const awayKey = awayTeamName.trim().toLowerCase();

  if (!penalized) return { homePowerPlay: false, awayPowerPlay: false };
  if (penalized === homeKey) return { homePowerPlay: false, awayPowerPlay: true };
  if (penalized === awayKey) return { homePowerPlay: true, awayPowerPlay: false };
  return { homePowerPlay: false, awayPowerPlay: false };
}

function normalizeTeamType(raw?: string | null): string {
  const value = String(raw || "").trim().toLowerCase();
  if (value.startsWith("girl")) return "Girls";
  if (value.startsWith("boy")) return "Boys";
  return "";
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
): RosterPlayerRow[] {
  const goalsByPlayer = new Map<string, number>();
  const assistsByPlayer = new Map<string, number>();
  const penaltyByPlayer = new Map<string, number>();

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

  return roster
    .filter((player) => player.isActive !== false)
    .map((player) => {
      const key = String(player.fullName || "").trim().toLowerCase();
      return {
        playerId: String(player.playerId),
        playerName: String(player.fullName || "Player"),
        jerseyNumber:
          typeof player.jerseyNumber === "number" ? String(player.jerseyNumber) : "",
        grade:
          typeof player.grade === "number"
            ? String(player.grade)
            : String(player.grade || "").trim(),
        goals: goalsByPlayer.get(key) || 0,
        assists: assistsByPlayer.get(key) || 0,
        penaltyMinutes: penaltyByPlayer.get(key) || 0,
      };
    })
    .sort((a, b) => a.playerName.localeCompare(b.playerName));
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
  const [homePowerPlay, setHomePowerPlay] = useState(false);
  const [awayPowerPlay, setAwayPowerPlay] = useState(false);
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

    async function load() {
      if (!gameId) {
        setErrorMessage("Missing gameId in URL.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

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
        ] = await Promise.all([
          getGameSummaryMobile(gameId),
          getTeams(),
          getGameShotTotalsFromStats(gameId).catch(() => null),
          getTeamRosterMobile(String(game.homeTeamId)),
          getTeamRosterMobile(String(game.awayTeamId)),
          getTeamCoachesMobile(String(game.homeTeamId)).catch(() => []),
          getTeamCoachesMobile(String(game.awayTeamId)).catch(() => []),
        ]);

        if (cancelled) return;

        const nextHomeName = String(game.homeTeamName || "Home");
        const nextAwayName = String(game.awayTeamName || "Away");
        setHomeTeamName(nextHomeName);
        setAwayTeamName(nextAwayName);

        const homeTeamMeta = teams.find((team) => String(team.teamId) === String(game.homeTeamId));
        const awayTeamMeta = teams.find((team) => String(team.teamId) === String(game.awayTeamId));
        const typeLabel = normalizeTeamType(homeTeamMeta?.teamType) || normalizeTeamType(awayTeamMeta?.teamType);
        const levelLabel = String(homeTeamMeta?.levelName || awayTeamMeta?.levelName || "").trim();
        const detailSuffix = [typeLabel, levelLabel].filter(Boolean).join(" ").trim();

        setGameTitle(
          detailSuffix
            ? `${nextAwayName} at ${nextHomeName} - ${detailSuffix}`
            : `${nextAwayName} at ${nextHomeName}`,
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

        const powerPlay = inferPowerPlay(summary, nextHomeName, nextAwayName, isInProgress);
        setHomePowerPlay(powerPlay.homePowerPlay);
        setAwayPowerPlay(powerPlay.awayPowerPlay);

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

        setHomeRoster(buildRosterRows(homeRosterRaw, summary));
        setAwayRoster(buildRosterRows(awayRosterRaw, summary));
        setHomeCoaches(homeCoachesRaw);
        setAwayCoaches(awayCoachesRaw);

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
        setEventPage(1);
      } catch (error) {
        if (cancelled) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load game detail.",
        );
      } finally {
        if (!cancelled) {
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
              awayTeam={awayTeamName}
              homeTeam={homeTeamName}
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
              awayPowerPlay={awayPowerPlay}
              homePowerPlay={homePowerPlay}
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

          <section className="game-view-section">
            <RosterTabs
              homeTeamName={homeTeamName}
              awayTeamName={awayTeamName}
              homeRoster={homeRoster}
              awayRoster={awayRoster}
              homeCoaches={homeCoaches}
              awayCoaches={awayCoaches}
              activeTab={activeRosterTab}
              onTabChange={setActiveRosterTab}
            />
          </section>
        </>
      )}
    </main>
  );
}
