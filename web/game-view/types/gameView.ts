export type TeamType = "Girls" | "Boys";

export interface GameViewFilters {
  organizationId: string;
  teamId: string;
  teamType: TeamType | "";
}

export interface GameViewFilterOption {
  id: string;
  label: string;
}

export interface GameViewFilterData {
  organizations: GameViewFilterOption[];
  teams: Array<GameViewFilterOption & { teamType?: string; seasonId?: string }>;
}

export interface NextGameCardModel {
  gameId: string;
  teamId: string;
  teamName: string;
  opponentName: string;
  matchupLabel?: string;
  teamContextLabel?: string;
  startTimeIso: string;
  status: string;
  isLive: boolean;
  homeScore?: number;
  awayScore?: number;
}

export interface UpcomingScheduleItemModel {
  gameId: string;
  startTimeIso: string;
  homeTeamName: string;
  awayTeamName: string;
  matchupLabel?: string;
  teamContextLabel?: string;
  status: string;
}

export interface LastFinalGameItemModel {
  gameId: string;
  homeTeamName: string;
  awayTeamName: string;
  matchupLabel?: string;
  teamContextLabel?: string;
  gameDateIso: string;
  status: string;
  scoreText: string;
}

export interface ApiSeason {
  seasonId: string;
  seasonName?: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface ApiOrganization {
  organizationId: string;
  name?: string | null;
  abbreviation?: string | null;
  mascot?: string | null;
  isActive: boolean;
}

export interface ApiTeam {
  teamId: string;
  organizationId?: string | null;
  seasonId?: string | null;
  name?: string | null;
  teamType?: string | null;
  levelName?: string | null;
  teamMascot?: string | null;
  isActive?: boolean;
}

export interface ApiGameListItem {
  gameId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  gameDateTime: string;
  status: string;
}

export interface ApiGameDetail {
  gameId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  gameDateTime: string;
  status: string;
  periodLengthMinutes: number;
}

export interface ApiNextGame {
  gameId: string;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  opponentName: string;
  startTime: string;
  teamType?: string | null;
  levelName?: string | null;
  homeTeamMascot?: string | null;
  awayTeamMascot?: string | null;
}

export interface ApiSummaryGoal {
  eventId: string;
  period?: number;
  timeInPeriod?: string;
  teamName: string;
  scorerName?: string;
  assist1Name?: string | null;
  assist2Name?: string | null;
}

export interface ApiSummaryPenalty {
  eventId: string;
  period?: number;
  timeInPeriod?: string;
  teamName: string;
  playerName: string;
  infraction: string;
  durationMinutes: number;
}

export interface ApiGameSummary {
  gameId: string;
  goals: ApiSummaryGoal[];
  penalties: ApiSummaryPenalty[];
  homeShotsP1?: number;
  homeShotsP2?: number;
  homeShotsP3?: number;
  homeShotsOT?: number;
  homeShots?: number;
  awayShotsP1?: number;
  awayShotsP2?: number;
  awayShotsP3?: number;
  awayShotsOT?: number;
  awayShots?: number;
  homeOnPowerPlay?: boolean;
  awayOnPowerPlay?: boolean;
}

export interface ApiRosterPlayer {
  playerId: string;
  fullName: string;
  jerseyNumber?: number | null;
  grade?: number | string | null;
  isActive?: boolean;
}

export interface ApiTeamCoach {
  roleName: string;
  coachName: string;
  coachEmail?: string | null;
}
