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
}

export function EventFeed({ events }: Props) {
  return (
    <section className="game-view-events-card">
      <h2 className="game-view-section-title">Event Feed</h2>

      {events.length === 0 ? (
        <p className="game-view-empty-text">No game events found.</p>
      ) : (
        <ul className="game-view-events-list" aria-label="Game events" tabIndex={0}>
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

    </section>
  );
}
