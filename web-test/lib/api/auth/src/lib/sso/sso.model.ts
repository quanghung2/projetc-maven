export interface GetJwtReq {
  appId: string;
}

export interface GetJwtResp {
  token: string;
}

export interface VerifyJWtResp {
  appId: string;
  email: string;
  identityUuid: string;
  orgUuid: string;
}

export interface AppInfo {
  accessToken: string;
  appConfigUrl: AppConfigUrl;
  appId: string;
  appSecret: string;
  beta: boolean;
  featureList;
  iconUrl: string;
  id: number;
  identityUuid: string;
  name: string;
  numberConfig: string;
  onPortal: boolean;
  orgUuid: string;
  published: boolean;
  skuList;
  status: string;
  type: string;
  visibility: string;
  voiceMode;
}

export interface AppConfigUrl {
  defaultCallNotifyUrl: string;
  defaultSmsNotifyUrl: string;
  id: number;
  path: string;
  redirectUrl: string;
}
