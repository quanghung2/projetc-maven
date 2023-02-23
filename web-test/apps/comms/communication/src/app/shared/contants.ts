import { HashMap } from '@datorama/akita';

export enum ROUTE_LINK {
  call_histories = 'call-history',
  sms_histories = 'sms-history',
  campaign = 'campaign',
  workforce_monitoring = 'workspace',
  agent_list = 'agent_list',
  active_call = 'active_call',
  activity_log = 'activity_log',
  users = 'users',
  statistics = 'statistics',
  calls = 'calls',
  bulk_filtering = 'bulk_filtering',
  compliance = 'compliance',
  notes = 'notes',
  chats = 'chats'
}

export interface RouteMap {
  urlPath: ROUTE_LINK;
  displayText: string;
  order: number;
  hasSubMenu?: boolean;
}

export enum ChatMenu {
  assigned_chats = 'assigned-chats',
  completed_chats = 'completed-chats',
  pending_chats = 'pending-chats'
}

export const MENU_ROUTE_MAPS: HashMap<RouteMap> = {
  users: { urlPath: ROUTE_LINK.users, displayText: 'Users', order: 1, hasSubMenu: true },
  statistics: { urlPath: ROUTE_LINK.statistics, displayText: 'Statistics', order: 1, hasSubMenu: true },
  calls: { urlPath: ROUTE_LINK.calls, displayText: 'Calls', order: 2, hasSubMenu: true },
  chats: { urlPath: ROUTE_LINK.chats, displayText: 'Chats', order: 3, hasSubMenu: true },
  activity_log: { urlPath: ROUTE_LINK.activity_log, displayText: 'Activity Logs', order: 4 },
  campaign: { urlPath: ROUTE_LINK.campaign, displayText: 'Campaign', order: 5 },
  compliance: { urlPath: ROUTE_LINK.compliance, displayText: 'Compliance', order: 6 },
  bulk_filtering: { urlPath: ROUTE_LINK.bulk_filtering, displayText: 'Bulk Filtering', order: 7 },
  notes: { urlPath: ROUTE_LINK.notes, displayText: 'Notes', order: 8 },
  call_histories: { urlPath: ROUTE_LINK.call_histories, displayText: 'Call History', order: 9 },
  sms_histories: { urlPath: ROUTE_LINK.sms_histories, displayText: 'SMS History', order: 10 }
};

export const RIGHT_SETTING_SIDEBAR_ID = 'RIGHT_SETTING_SIDEBAR_ID';
export const USER_HEADER_LEFT_SECTION_ID = 'USER_HEADER_LEFT_SECTION_ID';
