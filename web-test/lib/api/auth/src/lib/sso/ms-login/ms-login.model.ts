export interface CreateRedirectLinkReq {
  deviceType: string;
  srcUrl: string;
  activationToken?: string;
}

export interface VerifyStatusReq {
  state: string;
  code: string;
}
