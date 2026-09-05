import { useMemo } from "react";
import type { GameViewFilters } from "../types/gameView";

export function useGameViewFilters(filters: GameViewFilters) {
  return useMemo(() => {
    const query = new URLSearchParams();

    if (filters.seasonId) query.set("seasonId", filters.seasonId);
    if (filters.organizationId) query.set("organizationId", filters.organizationId);
    if (filters.leagueId) query.set("leagueId", filters.leagueId);
    if (filters.teamLevel) query.set("teamLevel", filters.teamLevel);
    if (filters.teamType) query.set("teamType", filters.teamType);

    return query;
  }, [filters.seasonId, filters.organizationId, filters.leagueId, filters.teamLevel, filters.teamType]);
}
