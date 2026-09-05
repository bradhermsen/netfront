import type { GameViewFilters } from "../types/gameView";

export interface GameViewState {
  filters: GameViewFilters;
  isLoading: boolean;
  errorMessage: string;
}

export const initialGameViewState: GameViewState = {
  filters: {
    organizationId: "",
    leagueId: "",
    teamLevel: "",
    teamType: "",
  },
  isLoading: false,
  errorMessage: "",
};
