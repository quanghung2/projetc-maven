import { HashMap } from '@datorama/akita';

export enum RULE_CHECKBOXES {
  callWaiting = 'Enable call waiting',
  privateCallerId = 'Allow make outgoing with private CallerID',
  enableDebugMode = 'Enable debug mode',
  usingPin = 'Enable passcode'
}

export enum APP_LINK {
  user = 'user',
  dev = 'dev',
  admin = 'admin'
}

export enum USER_LINK {
  workingHours = 'working-hours',
  notifications = 'notifications',
  devices = 'devices',
  delegate = 'delegate',
  callForwarding = 'call-forwarding',
  inboundBlacklist = 'inbound-blacklist',
  inboundWhitelist = 'inbound-whitelist',
  inboundCall = 'inbound-call',
  outboundCall = 'outbound-call',
  callRecordings = 'call-recordings',
  outboundCallRule = 'ocr',
  ipPhone = 'ip-phone',
  inboundCallRule = 'inbound-call-rule',
  inboundCallFilter = 'inbound-call-filter',
  overview = 'overview',
  inboundMissedCalls = 'inbound-missed-calls'
}

export enum DEV_LINK {
  api_keys = 'api-keys',
  webhooks = 'webhooks',
  programmable_flow = 'programmable-flow'
}

export enum ADMIN_LINK {
  admin_tools = 'admin-tools',
  call_histories = 'call-history',
  reports = 'reports',
  microsoft_teams = 'microsoft-teams',
  outbound_rule = 'outbound-rule',
  wa_integration = 'wa-integration',
  wa_canned_response = 'wa-canned-response',
  wa_auto_response = 'wa-auto-response',
  compliance = 'compliance',
  call_group = 'call-group',
  auto_attendant = 'auto-attendant',
  booking = 'booking',
  unified_workspace = 'unified_workspace'
}

export declare type ROUTE_LINK = USER_LINK | ADMIN_LINK | DEV_LINK;

export interface RouteMap {
  urlPath: string | ROUTE_LINK;
  displayText: string;
}

export const USER_ROUTE_MAPS: HashMap<RouteMap> = {
  // User menus
  workingHours: { urlPath: APP_LINK.user + '/' + USER_LINK.workingHours, displayText: 'Working Hours' },
  // { key: APP_LINK.user + '/' +  ROUTE_LINK.notifications, value: 'Notifications',group :GROUP_ROUTE.general },
  devices: { urlPath: APP_LINK.user + '/' + USER_LINK.devices, displayText: 'Devices' },
  delegate: { urlPath: APP_LINK.user + '/' + USER_LINK.delegate, displayText: 'Delegate' },
  callForwarding: { urlPath: APP_LINK.user + '/' + USER_LINK.callForwarding, displayText: 'Call Forwarding' },
  inboundBlacklist: {
    urlPath: APP_LINK.user + '/' + USER_LINK.inboundBlacklist,
    displayText: 'Inbound Call Blacklist'
  },
  inboundWhitelist: {
    urlPath: APP_LINK.user + '/' + USER_LINK.inboundWhitelist,
    displayText: 'Inbound Call Whitelist'
  },
  inboundCall: { urlPath: APP_LINK.user + '/' + USER_LINK.inboundCall, displayText: 'Inbound Call' },
  outboundCall: { urlPath: APP_LINK.user + '/' + USER_LINK.outboundCall, displayText: 'Outbound Call' },
  outboundCallRule: { urlPath: APP_LINK.user + '/' + USER_LINK.outboundCallRule, displayText: 'Outbound Call Rule' },
  callRecordings: { urlPath: APP_LINK.user + '/' + USER_LINK.callRecordings, displayText: 'Call Recordings' }, // this page need cr license
  ipPhone: { urlPath: APP_LINK.user + '/' + USER_LINK.ipPhone, displayText: 'IP Phones' },
  inboundCallRule: { urlPath: APP_LINK.user + '/' + USER_LINK.inboundCallRule, displayText: 'Inbound Call Rule' },
  inboundCallFilter: { urlPath: APP_LINK.user + '/' + USER_LINK.inboundCallFilter, displayText: 'Inbound Call Filter' },
  inboundMissedCalls: {
    urlPath: APP_LINK.user + '/' + USER_LINK.inboundMissedCalls,
    displayText: 'Inbound Missed Calls'
  },
  overview: { urlPath: APP_LINK.user + '/' + USER_LINK.overview, displayText: 'Overview' }
};

export const DEV_ROUTE_MAPS: HashMap<RouteMap> = {
  api_keys: { urlPath: APP_LINK.dev + '/' + DEV_LINK.api_keys, displayText: 'API Keys' },
  webhooks: { urlPath: APP_LINK.dev + '/' + DEV_LINK.webhooks, displayText: 'Webhooks' },
  programmable_flow: { urlPath: APP_LINK.dev + '/' + DEV_LINK.programmable_flow, displayText: 'Programmable Flow' }
};

export const ADMIN_ROUTE_MAPS: HashMap<RouteMap> = {
  admin_tools: { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.admin_tools, displayText: 'Admin Tools' },
  call_histories: { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.call_histories, displayText: 'Call History' },
  reports: { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.reports, displayText: 'Reports' },
  microsoft_teams: { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.microsoft_teams, displayText: 'Microsoft Teams' },
  // wa_integration: { key: APP_LINK.admin + '/' + ADMIN_LINK.unified_workspace + '/' + ADMIN_LINK.wa_integration, value: 'Integration' },
  wa_canned_response: {
    urlPath: APP_LINK.admin + '/' + ADMIN_LINK.unified_workspace + '/' + ADMIN_LINK.wa_canned_response,
    displayText: 'Canned Response'
  },
  wa_auto_response: {
    urlPath: APP_LINK.admin + '/' + ADMIN_LINK.unified_workspace + '/' + ADMIN_LINK.wa_auto_response,
    displayText: 'Auto Response'
  },
  // compliance: { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.compliance, displayText: 'Compliance' }, // don't need for now
  call_group: { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.call_group, displayText: 'Call Groups' },
  auto_attendant: { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.auto_attendant, displayText: 'Auto Attendant' },
  booking: { urlPath: APP_LINK.admin + '/' + ADMIN_LINK.booking, displayText: 'Booking' }
};

export const RIGHT_SETTING_SIDEBAR_ID = 'RIGHT_SETTING_SIDEBAR_ID';
export const USER_HEADER_LEFT_SECTION_ID = 'USER_HEADER_LEFT_SECTION_ID';

export const DEFAULT_WARNING_MESSAGE = 'Cannot update settings. Please try again in a few minutes';
