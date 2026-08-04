import { useMemo } from "react";
import type { GameViewFilters } from "../types/gameView";

export function useGameViewFilters(filters: GameViewFilters) {
  return useMemo(() => {
    const query = new URLSearchParams();

    if (filters.organizationId) query.set("organizationId", filters.organizationId);
    if (filters.teamId) query.set("teamId", filters.teamId);
    if (filters.teamType) query.set("teamType", filters.teamType);

    return query;
  }, [filters.organizationId, filters.teamId, filters.teamType]);
}
