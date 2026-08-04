import React from "react";
import { GameDetailScreen } from "../screens/GameDetailScreen";
import { GameViewMainScreen } from "../screens/GameViewMainScreen";

function hasGameIdInQuery() {
  const params = new URLSearchParams(window.location.search);
  return Boolean(params.get("gameId"));
}

export function App() {
  return hasGameIdInQuery() ? <GameDetailScreen /> : <GameViewMainScreen />;
}
