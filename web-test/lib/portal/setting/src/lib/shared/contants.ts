export enum PERMISSION_CHECKBOXES {
  allowCallRecording = 'Allow call recording controls',
  allowDNC = 'Allow Do-Not-Call controls',
  allowAccessCR = 'Allow access call recording files',
  allowPrivateCallerId = 'Allow private CallerID outgoing calls'
}

export enum FEATURE_CHECKBOXES {
  enableCallWaiting = 'Enable call waiting',
  enableDebugMode = 'Enable debug mode',
  usingPin = 'Enable passcode',
  enableWhitelist = 'Enable personal whitelist',
  enableAndroidBackground = 'Enable Android Background'
}

export enum APP_LINK {
  user = 'user',
  admin = 'admin'
}

export enum USER_LINK {
  overview = 'overview',
  callForwarding = 'call-forwarding',
  callRecordings = 'call-recordings',
  delegate = 'delegate',
  devices = 'devices',
  inboundCall = 'inbound-call',
  inboundCallFilter = 'inbound-call-filter',
  inboundMissedCalls = 'inbound-missed-calls',
  musicOnHold = 'music-on-hold',
  outboundCall = 'outbound-call',
  workingHours = 'working-hours'
}

export enum ADMIN_LINK {
  // phone system
  generalSettings = 'general',

  generalPhoneSystem = 'phone-system', // child for phone system only

  adminTools = 'admin-tools',
  microsoftTeams = 'microsoft-teams',
  ipPhone = 'ip-phone',
  callGroup = 'call-group',
  busyLampField = 'busy-lamp-field',
  queueManagement = 'queue-management',
  inboxManagement = 'inbox-management',

  // aa
  autoAttendant = 'auto-attendant',

  // org level
  inboundCallRule = 'inbound-call-rule',
  outboundCallRule = 'outbound-call-rule',
  bookingMeeting = 'booking-meeting',
  emailConfig = 'email-config',

  surveyTemplate = 'survey-template'
}

export declare type ROUTE_LINK = USER_LINK | ADMIN_LINK;

export const RIGHT_SETTING_SIDEBAR_ID = 'RIGHT_SETTING_SIDEBAR_ID';
export const USER_HEADER_LEFT_SECTION_ID = 'USER_HEADER_LEFT_SECTION_ID';

export const DEFAULT_WARNING_MESSAGE = 'Cannot update settings. Please try again in a few minutes';
