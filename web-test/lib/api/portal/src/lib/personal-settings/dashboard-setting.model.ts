import { TimeRange, TimeRangeKey } from '@b3networks/shared/common';
import { ID } from '@datorama/akita';
import { AppSettings } from './callcenter-setting.model';

export interface DashboardAppDashboardSetting {
  id: ID;
  autoRefresh: boolean;
  autoRefreshTime: number;
  timeRange: TimeRangeKey;
  dateFiltering?: Date | string;
  addon?: { [TKey in any]: any };
  specificDateRange: TimeRange;
}

export interface DashboardAppSetting extends AppSettings {
  dashboards: DashboardAppDashboardSetting[];
}
