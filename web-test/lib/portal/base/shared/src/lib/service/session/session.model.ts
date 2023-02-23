export interface RememberMeData {
  loginId: string;
  seriesId: string;
  domain: string;
}

export interface SessionData {
  sessionToken: string;
  sessionId?: string;
  identityUuid?: string;
  domain?: string;
  expiryAt?: number;
}
