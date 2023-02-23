export const DISTRIBUTION_DOMAINS = ['portal.b3networks.com', 'onboard.b3networks.com', 'portal-uat.b3networks.com'];

export const fileImage = 'bmp|jpg|jpeg|gif|png|webp|svg';
export const fileAudio = 'mp3|wav|ogg';
export const fileVideo = 'ogv|mp4|mov|webm';
export const fileWord = 'doc|docx|odt';
export const fileExcel = 'xls|xlsx|ods';
export const filePowerPoint = 'ppt|pptx|odp';
export const fileZip = 'zip|tar|gz|rar|7z';
export const fileAsImage = 'tiff';
export const filePdf = 'pdf';
export const fileText = 'txt|rtf|json|xml';
export const fileCode = 'html|css|js';

export const APP_IDS = {
  WHATAPPS: 'nWyRmvDLj3J9wGqi',
  UNIFIED_WORKSPACE: '1pxjX3FQumSFHzjC',
  DASHBOARD: 'drX4Id5eTSKpJUzC',
  FLOW: 'a4Az8QVOuS75ahkQ',
  WORKSPACE: 'Pl06ZBdRuO3xbeMh',
  WALLBOARD: 'Y4v35i2TXBM0XL2l',
  VIRTUAL_LINE: '4ESLmjmXaWH0jcxT',
  CALL_TRACKING: 'DuCLEUPORmhjHjKX',
  PHONE_SETTING: '4dY1X5H0pF0jqbTy',
  SSO_IDP_TEST: '5hXSB78JSubOssiL',
  GLOBAL_DNC: 'LzgWeisit8OewfM1',

  // b3
  LEAVE: 'p21kL1Z0rc7LGR72',

  // license apps
  APPLICATIONS_SETTING: 'member-settings',
  COMMUNICATION_HUB: 'VM8od3o3pAQVbQIN',
  DEVELOPER_HUB: 'YHXoOJSx6vlJVvly',
  SSO_IDP: 'portal-module-sso-idp',
  SIPTRUNK: '8tEJ89MMuOVyiST0',
  AUTO_ATTENDANT: 'M0BHU7ZkN0ekybve',
  PHONE_SYSTEM: 'FS1b4bUeh8vct25g',
  BYOC_TRUNK: '11lehOezO2YAEjoH',
  FILE_EXPLORER: 'BiLrL9G6clY8TNCV',
  CONTACT: 'IX5LZU0Okzn0QMlr',

  // partner
  BUSINESS_HUB: '56wTHokRhrrScx0s',

  // portal module
  ORG_MANAGEMENTS: 'org-managements',
  SUPPORT_CENTER: 'rBccWkMjbEHrZGD2',
  CUSTOMER_REPORT: 'AdoRlc6AaEZnxFGD',
  RELEASE_NOTE: 'portal-module-release-note',
  STORE: 'YVNMmZ9yuj7QhO9b'
};

export const ISDN_PRODUCT = {
  id: 'p3d0r3gcO6ROYzxr',
  CR_Enterprise: 'n97g8J3b9MGI61qp',
  DPO_Enterprise: 'LzgWeisit8OewfM1',
  mobileDncCode: 'mobile_dnc',
  mobileCrCode: 'mobile_call_recording',

  mobileEnterpriseDnc: 'mobile_dpo',
  mobileEnterpriseCr: 'mobile_cr_compliance'
};

export const CHAT_PUBLIC_PREFIX = 'chat_public';
export const CHAT_PUBLIC_V2_PREFIX = 'chat/_tc';
export const CHAT_PUBLIC_V3_PREFIX = 'public/v2/_tc';

export const DEFAULT_ORG_LOGO = 'https://ui.b3networks.com/external/logo/default_org_icon.png';
export const DEFAULT_ORG_ICON = 'https://ui.b3networks.com/external/logo/default_org_icon.png';

export const X_PAGINATION = {
  totalCount: 'x-pagination-total-count'
};

export const USER_INFO = {
  orgUuid: 'orgUuid',
  sessionToken: 'sessionToken'
};

export const X_B3_HEADER = {
  orgUuid: 'x-user-org-uuid',
  sessionToken: 'x-credential-session-token',
  totalCount: 'x-pagination-total-count',
  widgetToken: 'x-wp-chat-widget-token',
  token: 'Token',
  domain: 'x-user-domain',
  userUuid: 'x-user-identity-uuid',
  clientAppId: 'x-client-app-id'
};

export const INJECT_PORTAL_DOMAIN = 'injectPortalDomain';
export const INJECT_PRODUCT_BUILD = 'injectProductBuild';

export const REPLACE_BY_SUBDOMAINS = [
  'cG9ydGFsLmhvaWlvLmNvbQ==',
  'dm4uaG9paW8uY29t',
  'c2cuaG9paW8uY29t',
  'bXkuaG9paW8uY29t',
  'aGsuaG9paW8uY29t',
  'dXMuaG9paW8uY29t',
  'YXUuaG9paW8uY29t'
]; // pt, vn, sg, my, hk, us, au

export const SUBDOMAIN = 'LmhvaWlvLmNvbQ==';

export const TESTING_UAT_DOMAINS = [
  'cG9ydGFsLXVhdC5ob2lpby5uZXQ=',
  'cG9ydGFsLXVhdC5iM25ldHdvcmtzLm5ldA==',
  'cG9ydGFsLXVhdC5iM25ldHdvcmtzLmNvbQ=='
];
export const TESTING_DOMAIN = 'cG9ydGFsLmhvaWlvLm5ldA==';

export const DEFAULT_API_PROXY = 'aHR0cHM6Ly9hcGkuYjNuZXR3b3Jrcy5jb20=';

export class MessageConstants {
  public static GENERAL_ERROR =
    'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.';
}

export const NUMBER_PRODUCT_ID = 'number.hoiio';

export const UUID_V4_REGEX = '[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89aAbB][a-f0-9]{3}-[a-f0-9]{12}';

export const B3_ORG_UUID = 'fc312420-0047-49a7-94a8-003f11f115c0';

export const B3_UAT_ORG_UUID = '8cd84d49-a5e2-49ba-993d-a8a5257ac55d';

export const HOIIO_INTERNAL_TESTING_ORG_UUID = '1a39064c-763c-4e31-ae30-4d87d901591c';

export const SESSION_NOTFOUND_CODE = 'auth.sessionNotFound';

export const ERROR_PERMISSION = {
  message: "You don't have permission to perform this action",
  code: 'unauthenticated'
};

export const PORTAL_BASE_HANDLE_WS = 'PORTAL_BASE_HANDLE_WS';
export const DASHBOARD_V2_PREFIX = '/dashboard/private/v2';
export const DASHBOARD_V2_LOGGED_OUT = 'DASHBOARD_V2_LOGGED_OUT';
export const DEVICE_ACCESS_TOKEN = 'DEVICE_ACCESS_TOKEN';

export const STUN_SERVER = 'stun.b3networks.com';

export const FILE_EXPLORER = 'file_explorer';
export const AUTO_ATTENDANT = 'auto_attendant';
