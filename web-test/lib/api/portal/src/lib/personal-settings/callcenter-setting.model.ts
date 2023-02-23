import { TimeRangeKey } from '@b3networks/shared/common';

export interface AppSettings {
  orgUuid: string;
  appId: string;
}

export interface CallcenterDashboardSetting {
  queuesFiltering: string[];
  autoRefreshTime: number;
  timeRange: TimeRangeKey;
  dateFiltering?: Date | string;
}

export interface CallcenterWorkspaceAgentSetting {
  queueFiltering: string;
  autoRefreshTime: number;
  dateFiltering?: DateRange;
  isLatestDate?: boolean;
  sortBy?: string;
}

export interface CallcenterCallLogSetting {
  callType: string;
  timeRange: TimeRangeKey;
  startDate: string;
  endDate: string;
  filterBy: 'number' | 'txnUuid';
  fromNumber?: string;
  toNumber?: string;
  txnUuid?: string;
}

export interface CallcenterWorkspaceFeedbackSetting {
  timeRange: TimeRangeKey;
  filterByQueue: string;
  startDate?: string;
  endDate?: string;
  agent?: string;
  customerNumber?: string;
}

export interface CallcenterActivitiesLogSetting {
  timeRange: TimeRangeKey;
  agent?: string;
}

export enum CallcenterCallFeature {
  inbound = 'inbound',
  outbound = 'outbound'
}

export interface CallcenterAppSettings extends AppSettings {
  callFeature: CallcenterCallFeature;
  dashboard: CallcenterDashboardSetting;
  workspaceAgents: CallcenterWorkspaceAgentSetting;
  workspaceActiveCall: { autoRefreshTime: number };
  workspaceAnsweredCall: CallcenterCallLogSetting;
  workspaceUnansweredCall: CallcenterCallLogSetting;
  workspaceFeedback: CallcenterWorkspaceFeedbackSetting;
  queue: { searchString: string };
  activitiesLog: CallcenterActivitiesLogSetting;
  users: UserMenu; //lastest submenu on users tab
}

export interface DateRange {
  startDate?: Date | string;
  endDate?: Date | string;
}

export enum UserMenu {
  performance = 'performance',
  activity_log = 'activity_log',
  assigned_calls = 'assigned_calls'
}

export enum StatisticMenu {
  activity_log = 'activity_log',
  assigned_calls = 'assigned_calls'
}
