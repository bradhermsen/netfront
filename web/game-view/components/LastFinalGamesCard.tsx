import React from "react";
import type { LastFinalGameItemModel } from "../types/gameView";

interface Props {
  games: LastFinalGameItemModel[];
}

export function LastFinalGamesCard({ games }: Props) {
  return (
    <section className="game-view-section" aria-label="Game Finals">
      <h2 className="game-view-section-title">Game Finals</h2>

      {games.length === 0 ? (
        <p className="game-view-empty-text">No final games found.</p>
      ) : (
        <div className="game-view-card-grid">
          {games.map((game) => {
            const at = new Date(game.gameDateIso);
            const dateText = Number.isNaN(at.getTime())
              ? "TBD"
              : at.toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                });

            return (
              <article key={game.gameId} className="game-view-schedule-card">
                <p className="game-view-schedule-matchup">
                  {game.matchupLabel || `${game.awayTeamName} at ${game.homeTeamName}`}
                </p>
                <p className="game-view-schedule-meta">{dateText} • {game.status}</p>
                <p className="game-view-schedule-meta">{game.scoreText}</p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
