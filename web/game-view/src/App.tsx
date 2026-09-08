import React from "react";
import { GameDetailScreen } from "../screens/GameDetailScreen";
import { GameManagerMarketingScreen } from "../screens/GameManagerMarketingScreen";
import { GameViewMainScreen } from "../screens/GameViewMainScreen";

function hasGameIdInQuery() {
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get("gameId"));
}

function showGameManagerMarketing() {
  return (
    new URLSearchParams(window.location.search).get("about") === "game-manager"
  );
}

export function App() {
  return (
    <div className="tipin-site-shell">
      <div className="tipin-product-surface" data-product="gameview">
        {showGameManagerMarketing() ? (
          <GameManagerMarketingScreen />
        ) : hasGameIdInQuery() ? (
          <GameDetailScreen />
        ) : (
          <GameViewMainScreen />
        )}
      </div>
    </div>
  );
}
