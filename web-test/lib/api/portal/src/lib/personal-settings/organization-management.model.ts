import { ChatTypeTxn } from '@b3networks/api/callcenter';
import { CallType, EnumScope, StatusCall } from '@b3networks/api/data';
import { TimeRangeKey } from '@b3networks/shared/common';
import { AppSettings } from './callcenter-setting.model';

export interface UnifiedHistoryFilter {
  ignoreColumns?: string[];

  teamUuid?: EnumScope | string; // selectScope = team
  timeRange?: TimeRangeKey;
  startDate?: Date;
  endDate?: Date;
  callType?: CallType;
  status?: StatusCall;
  inputSearch?: string; // query all
  hasResource?: boolean;
  campaignUuid?: string; // call by campaign
  channel?: ChatTypeTxn | 'All'; // chat by type
  hasRecording?: boolean;
  hasVoicemail?: boolean;
}

export interface OrgManagementAppSettings extends AppSettings {
  unifiedHistory: UnifiedHistoryFilter;
}
