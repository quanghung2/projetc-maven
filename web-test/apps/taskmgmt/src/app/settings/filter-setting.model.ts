import { CaseStatus, User } from '@b3networks/api/workspace';

export interface CaseFiltering {
  searchQuery?: SearchQuery;
  status?: CaseStatus;
  activeTab?: 'assigned2me' | 'internal' | 'external';
  memberFiltering?: User | null;
}

export enum SearchBy {
  id = 'id',
  domain = 'domain',
  titleDesc = 'titleDesc',
  orgUuid = 'orgUuid'
}

export interface SearchQuery {
  type?: SearchBy;
  value?: string;
}
