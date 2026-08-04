import React from "react";
import type { ApiTeamCoach } from "../types/gameView";

export interface RosterPlayerRow {
  playerId: string;
  playerName: string;
  jerseyNumber: string;
  grade: string;
  goals: number;
  assists: number;
  penaltyMinutes: number;
}

interface Props {
  homeTeamName: string;
  awayTeamName: string;
  homeRoster: RosterPlayerRow[];
  awayRoster: RosterPlayerRow[];
  homeCoaches: ApiTeamCoach[];
  awayCoaches: ApiTeamCoach[];
  activeTab: "home" | "away";
  onTabChange: (tab: "home" | "away") => void;
}

export function RosterTabs({
  homeTeamName,
  awayTeamName,
  homeRoster,
  awayRoster,
  homeCoaches,
  awayCoaches,
  activeTab,
  onTabChange,
}: Props) {
  const rows = activeTab === "home" ? homeRoster : awayRoster;
  const coaches = activeTab === "home" ? homeCoaches : awayCoaches;

  return (
    <section className="game-view-roster-card">
      <h2 className="game-view-section-title">Rosters</h2>

      <div className="game-view-tab-row" role="tablist" aria-label="Roster tabs">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "home"}
          className={`game-view-tab ${activeTab === "home" ? "is-active" : ""}`}
          onClick={() => onTabChange("home")}
        >
          <span>{homeTeamName}</span>
          {activeTab === "home" ? <span className="game-view-selected-tag">Selected</span> : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "away"}
          className={`game-view-tab ${activeTab === "away" ? "is-active" : ""}`}
          onClick={() => onTabChange("away")}
        >
          <span>{awayTeamName}</span>
          {activeTab === "away" ? <span className="game-view-selected-tag">Selected</span> : null}
        </button>
      </div>

      <p className="game-view-roster-active-team" aria-live="polite">
        Viewing roster: <strong>{activeTab === "home" ? homeTeamName : awayTeamName}</strong>
      </p>

      {rows.length === 0 ? (
        <p className="game-view-empty-text">No roster data available.</p>
      ) : (
        <div className="game-view-roster-grid-wrap">
          <div className="game-view-roster-grid game-view-roster-grid-header">
            <span>Player #</span>
            <span>Player Name</span>
            <span>Grade</span>
            <span>Goals</span>
            <span>Assists</span>
            <span>PIM</span>
          </div>

          {rows.map((row) => (
            <div key={row.playerId} className="game-view-roster-grid game-view-roster-grid-row">
              <span>{row.jerseyNumber || "-"}</span>
              <span>{row.playerName}</span>
              <span>{row.grade || "-"}</span>
              <span>{row.goals}</span>
              <span>{row.assists}</span>
              <span>{row.penaltyMinutes}</span>
            </div>
          ))}
        </div>
      )}

      <section className="game-view-coach-data" aria-label="Team coach data">
        <h3 className="game-view-coach-data-title">Coaches</h3>
        {coaches.length === 0 ? (
          <p className="game-view-coach-data-empty">No coach data available.</p>
        ) : (
          <ul className="game-view-coach-data-list">
            {coaches.map((coach, index) => (
              <li
                key={`${coach.roleName}-${coach.coachName}-${index}`}
                className="game-view-coach-data-item"
              >
                <span className="game-view-coach-role">{coach.roleName}</span>
                <span className="game-view-coach-name">{coach.coachName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
