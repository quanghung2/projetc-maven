import { AppSettings } from './callcenter-setting.model';

export interface DashboardV2AppSettingFilter {
  dateTime: string;
  extensions: string[];
  includeNonQueue: boolean;
  queues: string[];
  searchExt: string;
  states: string[];
  timeRange: { startDate: string; endDate: string };
  customDate: string;
}

export interface DashboardV2AppSetting extends AppSettings {
  filters: DashboardV2AppSettingFilter;
  autoScroll: boolean;
  autoScrollThreshold: number;
  starredUuids: string[];
}
