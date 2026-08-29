import React, { useState } from "react";

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
  const [enabledEventTypes, setEnabledEventTypes] = useState({
    shot: true,
    goal: true,
    penalty: true,
  });
  const visibleEvents = events.filter((event) => enabledEventTypes[event.eventType]);

  return (
    <section className="game-view-events-card">
      <div className="game-view-events-header">
        <h2 className="game-view-section-title">Event Feed</h2>
        <div className="game-view-event-filters" aria-label="Event feed filters">
          {(["shot", "goal", "penalty"] as const).map((eventType) => {
            const isEnabled = enabledEventTypes[eventType];
            const label = eventType === "penalty" ? "Penalties" : `${eventType[0].toUpperCase()}${eventType.slice(1)}s`;

            return (
              <button
                key={eventType}
                type="button"
                className={`game-view-event-filter${isEnabled ? " game-view-event-filter--active" : ""}`}
                aria-pressed={isEnabled}
                onClick={() =>
                  setEnabledEventTypes((current) => ({
                    ...current,
                    [eventType]: !current[eventType],
                  }))
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {events.length === 0 ? (
        <p className="game-view-empty-text">No game events found.</p>
      ) : visibleEvents.length === 0 ? (
        <p className="game-view-empty-text">No events match the selected filters.</p>
      ) : (
        <ul className="game-view-events-list" aria-label="Game events" tabIndex={0}>
          {visibleEvents.map((event) => (
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
