import type { GameViewFilters } from "../types/gameView";

export interface GameViewState {
  filters: GameViewFilters;
  isLoading: boolean;
  errorMessage: string;
}

export const initialGameViewState: GameViewState = {
  filters: {
    organizationId: "",
    teamId: "",
    teamType: "",
  },
  isLoading: false,
  errorMessage: "",
};
