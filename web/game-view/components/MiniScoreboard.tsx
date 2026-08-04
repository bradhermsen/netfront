import React from "react";

interface Props {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  periodLabel: string;
  statusLabel: string;
  homeShots?: number;
  awayShots?: number;
  homeShotsP1?: number;
  homeShotsP2?: number;
  homeShotsP3?: number;
  awayShotsP1?: number;
  awayShotsP2?: number;
  awayShotsP3?: number;
  currentPeriodNumber?: number;
  homePowerPlay?: boolean;
  awayPowerPlay?: boolean;
  isInProgress?: boolean;
}

export function MiniScoreboard({
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  periodLabel,
  statusLabel,
  homeShots = 0,
  awayShots = 0,
  homeShotsP1,
  homeShotsP2,
  homeShotsP3,
  awayShotsP1,
  awayShotsP2,
  awayShotsP3,
  currentPeriodNumber,
  homePowerPlay = false,
  awayPowerPlay = false,
  isInProgress = false,
}: Props) {
  const statusText = String(statusLabel || "").trim().toUpperCase();
  const periodText = String(periodLabel || "").trim().toUpperCase();

  function formatPeriodShots(value: number | undefined, period: 1 | 2 | 3) {
    if (typeof value === "number") {
      return String(value);
    }
    if (typeof currentPeriodNumber === "number" && period > currentPeriodNumber) {
      return "--";
    }
    return "0";
  }

  return (
    <section className="game-view-scoreboard-card" aria-label="Mini Scoreboard">
      <div className="game-view-mini-statusbar">
        <span className="game-view-mini-status-dot" aria-hidden="true">•</span>
        {periodText ? <span className="game-view-mini-period-token">{periodText}</span> : null}
        {statusText ? (
          <span className={`game-view-mini-status-pill ${isInProgress ? "is-live" : ""}`}>
            {statusText}
          </span>
        ) : null}
      </div>

      <div className="game-view-mini-team-row">
        <div className="game-view-mini-team-left">
          <span className="game-view-mini-team-name">{awayTeam}</span>
          {awayPowerPlay ? <span className="game-view-mini-pp game-view-pill-green">PP</span> : null}
        </div>

        <div className="game-view-mini-team-right">
          <strong className="game-view-mini-team-score">{awayScore}</strong>
        </div>
      </div>

      <div className="game-view-mini-row-divider" aria-hidden="true" />

      <div className="game-view-mini-team-row">
        <div className="game-view-mini-team-left">
          <span className="game-view-mini-team-name">{homeTeam}</span>
          {homePowerPlay ? <span className="game-view-mini-pp game-view-pill-green">PP</span> : null}
        </div>

        <div className="game-view-mini-team-right">
          <strong className="game-view-mini-team-score">{homeScore}</strong>
        </div>
      </div>

      <div className="game-view-mini-row-divider" aria-hidden="true" />

      <div className="game-view-mini-shots-grid" aria-label="Shots on goal by period">
        <div className="game-view-mini-shots-grid-header">
          <span className="game-view-mini-shots-h-sog">SOG</span>
          <span>P1</span>
          <span>P2</span>
          <span>P3</span>
          <span>TOT</span>
        </div>

        <div className="game-view-mini-shots-grid-row">
          <span className="game-view-mini-shots-team">{awayTeam}</span>
          <span>{formatPeriodShots(awayShotsP1, 1)}</span>
          <span>{formatPeriodShots(awayShotsP2, 2)}</span>
          <span>{formatPeriodShots(awayShotsP3, 3)}</span>
          <span className="game-view-mini-shots-total">{awayShots}</span>
        </div>

        <div className="game-view-mini-shots-grid-row">
          <span className="game-view-mini-shots-team">{homeTeam}</span>
          <span>{formatPeriodShots(homeShotsP1, 1)}</span>
          <span>{formatPeriodShots(homeShotsP2, 2)}</span>
          <span>{formatPeriodShots(homeShotsP3, 3)}</span>
          <span className="game-view-mini-shots-total">{homeShots}</span>
        </div>
      </div>

      <div className="game-view-mini-footer" aria-hidden="true">
        SCOREBOARD
      </div>
    </section>
  );
}
