import React from "react";

export interface GameEventRow {
  eventId: string;
  eventType: "goal" | "penalty" | "shot";
  description: string;
  createdAtIso: string;
}

interface Props {
  events: GameEventRow[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function EventFeed({ events, currentPage, totalPages, onPageChange }: Props) {
  function getIcon(eventType: GameEventRow["eventType"]) {
    if (eventType === "goal") return "G";
    if (eventType === "penalty") return "P";
    return "S";
  }

  return (
    <section className="game-view-events-card">
      <h2 className="game-view-section-title">Event Feed</h2>

      {events.length === 0 ? (
        <p className="game-view-empty-text">No game events found.</p>
      ) : (
        <ul className="game-view-events-list">
          {events.map((event) => (
            <li key={event.eventId} className="game-view-event-row">
              <span className={`game-view-event-icon is-${event.eventType}`} aria-hidden="true">
                {getIcon(event.eventType)}
              </span>
              <div>
                <p className="game-view-event-description">{event.description}</p>
                <p className="game-view-event-time">{event.createdAtIso}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="game-view-pagination game-view-detail-pagination">
          <button
            className="game-view-pagination-btn"
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Prev
          </button>
          <span className="game-view-pagination-label">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="game-view-pagination-btn"
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      ) : null}
    </section>
  );
}
