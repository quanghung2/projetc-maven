export enum PublicAccessStatus {
  disabled = 'disabled',
  active = 'active'
}

export class PublicAccess {
  name: string;
  dashboardUuid: string;
  ref: string;
  status: PublicAccessStatus;
  createdAt: string;
}

export interface CreatedAccessLinkReq {
  name: string;
  dashboardUuid: string;
  password: string;
}

export class AuthenticatedAccessLink {
  name: string;
  dashboardUuid: string;
  ref: string;
  sessionToken: string;
  orgUuid: string;
}
