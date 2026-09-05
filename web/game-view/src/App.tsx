import React from "react";
import { GameDetailScreen } from "../screens/GameDetailScreen";
import { GameViewMainScreen } from "../screens/GameViewMainScreen";

function hasGameIdInQuery() {
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get("gameId"));
}

export function App() {
  return (
    <div className="tipin-site-shell">
      <div className="tipin-product-surface" data-product="gameview">
        {hasGameIdInQuery() ? <GameDetailScreen /> : <GameViewMainScreen />}
      </div>
    </div>
  );
}
