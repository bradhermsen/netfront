export interface ConferenceDistrict {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface SectionRegion {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface OrganizationDto {
  organizationId: string;
  name: string;
  abbreviation?: string;
  leagueId?: string;
  leagueName?: string;
  city?: string;
  state?: string;
  teamCount?: number;
  isActive: boolean;
}

export interface TeamDto {
  teamId: string;
  organizationId?: string;
  organizationName?: string;
  levelId?: string;
  levelName?: string;
  seasonId?: string;
  seasonName?: string;
  conferenceDistrictId?: string;
  conferenceDistrictName?: string;
  sectionRegionId?: string;
  sectionRegionName?: string;
  name: string;
  abbreviation?: string;
  isActive: boolean;
}

export interface TeamCreateUpdateDto {
  name: string;
  organizationId?: string | null;
  conferenceDistrictId?: string | null;
  sectionRegionId?: string | null;
  levelId?: string | null;
  seasonId?: string | null;
  abbreviation?: string | null;
  notes?: string | null;
  isActive: boolean;
  isExternal: boolean;
}
