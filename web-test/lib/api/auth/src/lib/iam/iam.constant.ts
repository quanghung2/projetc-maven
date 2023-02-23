export const IAM_SERVICES = {
  dashboard: 'dashboard',
  ui: 'ui',
  sim: 'sim',
  billing: 'billing',
  flow: 'flow',
  auth: 'auth',
  dnc: 'dnc',
  devhub: 'devhub'
};

export const IAM_DNC_ACTIONS = {
  update_setting: 'UpdateSettings' // allow dnc controls
};

export const IAM_DASHBOARD_ACTIONS = {
  readOnly: 'ReadOnly',
  manage: 'Manage'
};

export const IAM_SIM_ACTIONS = {
  update_number_configuration: 'UpdateNumberConfiguration'
};

export const IAM_BILLING_ACTIONS = {
  view_reports: 'ViewReports'
};

export const IAM_AUTH_ACTIONS = {
  view_title: 'ViewTitle',
  view_organization_group_member: 'ViewOrganizationGroupMember'
};

export const IAM_UI_ACTIONS = {
  show_org_menu: 'ShowOrganizationMenu',
  enable_interface: 'EnableInterface',
  display_sidebar_feature: 'DisplaySidebarFeature',
  show_subscription_column: 'ShowSubscriptionColumn', // using on subscription list page
  show_subscription_menu: 'ShowSubscriptionMenu', // using on subscription details page
  enable_license: 'EnableLicense', // show or hide license module page,
  ManageOrganization: 'ManageOrganization', // show manage org
  enableUWFeature: 'EnableUWFeature',
  hide_call_recording: 'HideCallRecording'
};

export const IAM_DEVHUB_ACTIONS = {
  access: 'Access'
};

// https://b3networks.atlassian.net/wiki/spaces/POR/pages/2019852289/IAM+Permission+Group
export const IAM_GROUP_UUIDS = {
  people: '11ee8ba3-7f7e-45f4-826a-d929b23eea18',
  organizationSetting: 'c1d260b5-46af-4409-a824-66ccd2c1bf20',
  contact: '327de918-c285-44fe-a233-5abe3158d073',
  phoneSystem: 'd103f26d-32f3-4902-bdf3-680d7a9057c4',
  developer: '210e19c6-b1b4-495d-8865-f5844363db2c',
  autoAttendant: 'b5b69cdc-3df9-46d4-82f4-60af09afe865',
  sip: 'ddd7a765-2b19-4044-abf6-60ff6b9f3e01',
  eFax: 'eab224a0-c80e-487b-a6aa-54023a3b7403',
  businessHub: 'da1bd277-d86c-4001-ae91-bd7d4ebb2816',
  fileExplorer: '0c0fa3c1-cee7-4e27-b1a9-e0a4ad16c51e',
  dashboard: '09d6789d-2424-4a1c-9da8-687522ee8998'
};

export const IAM_AUTH_RESOURCES = {
  vip: 'VIP'
};

export const IAM_UI_RESOURCES = {
  //EnableInterface
  new_landing: 'new_landing',
  new_organization_home: 'new_organization_home',
  credential_username: 'credential_username',

  // DisplaySidebarFeature
  unified_workspace: 'unified_workspace',
  dashboard: 'dashboard',
  flow: 'flow',
  contact: 'contact',
  supportCenter: 'support_center',
  phoneSystem: 'phone_system',
  autoAttendant: 'auto_attendant',
  fileExplorer: 'file_explorer',
  store: 'store',

  // feature code for org-management app
  org_team: 'team',
  org_api: 'api_key',
  org_webhooks: 'webhook',
  org_call_history: 'call_history',
  org_license: 'license',
  org_myinfo: 'myinfo',
  org_canned_response: 'uw_canned_response',
  org_auto_response: 'uw_auto_response',
  org_billing_address: 'billing_address',
  org_booking: 'booking',
  meetings: 'meetings',

  // ManageOrganization
  address: 'address',
  audit: 'audit',
  digital_identity: 'digital identity',
  payment: 'payment',
  invoice: 'invoice',
  usage_history: 'usage_history',
  organizationLink: 'organization_link',
  report: 'report',
  member_directory: 'member_directory',

  // enableUWFeature
  hyperspace: 'hyperspace',
  email: 'email',
  releases: 'releases'
};

export const TOOLTIP_ACTION_PERMISSION = {
  View: 'Allows users to browse and download files.',
  Manage: 'Allows users to have full permission to the files (browse, download, delete, restore, shred).'
};
