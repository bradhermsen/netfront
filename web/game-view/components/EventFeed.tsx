import React from "react";

export interface GameEventRow {
  eventId: string;
  eventType: "goal" | "penalty" | "shot";
  title: string;
  subtitle?: string;
  createdAtIso: string;
}

interface Props {
  events: GameEventRow[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function EventFeed({ events, currentPage, totalPages, onPageChange }: Props) {
  return (
    <section className="game-view-events-card">
      <h2 className="game-view-section-title">Event Feed</h2>

      {events.length === 0 ? (
        <p className="game-view-empty-text">No game events found.</p>
      ) : (
        <ul className="game-view-events-list">
          {events.map((event) => (
            <li key={event.eventId} className="game-view-event-row">
              <div>
                <p className="game-view-event-time">{event.createdAtIso}</p>
                <p className="game-view-event-description">{event.title}</p>
                {event.subtitle ? (
                  <p className="game-view-event-subtitle">{event.subtitle}</p>
                ) : null}
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
