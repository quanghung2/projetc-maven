import {AppSettings, DateRange, StatisticMenu, UserMenu} from '@b3networks/api/portal';
import { TimeRangeKey } from '@b3networks/shared/common';

export interface CommunicationAppSettings extends AppSettings {
  userPerformance: UserPerformanceSetting;
  callFeature: CallFeature;
  activitiesLog: CommunicationActivitiesLogSetting;
  users: UserMenu | StatisticMenu; //lastest submenu on users tab
  activeCall: { autoRefreshTime: number };
  completedCall: CommunicationCompletedCallSettings;
  assignedCall: CommunicationAssignedCallSettings;
}

export interface UserPerformanceSetting {
  queueFiltering: string;
  autoRefreshTime: number;
  dateFiltering?: DateRange;
  isLatestDate?: boolean;
  sortBy?: string;
}

export interface CommunicationActivitiesLogSetting {
  timeRange: TimeRangeKey;
  agent?: string;
}

export enum CallFeature {
  inbound = 'inbound',
  outbound = 'outbound'
}

export interface CommunicationCompletedCallSettings {
  type: 'incoming' | 'callback';
  usersFiltering?: string[] | 'No filtered';
  queuesFiltering?: string[] | 'No filtered';
  resultFiltering?: string[] | 'No filtered';
  dateFiltering?: DateRange;
  isLatestDate?: boolean;
}

export interface CommunicationAssignedCallSettings {
  type: 'incoming' | 'callback';
  usersFiltering?: string[] | 'No filtered';
  queuesFiltering?: string[] | 'No filtered';
  resultFiltering?: string[] | 'No filtered';
  dateFiltering?: DateRange;
  isLatestDate?: boolean;
}
