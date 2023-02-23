export interface DirectRoutingExtension {
  teamUsername: string;
  isProvisionedToAnynode?: boolean;
  device: DeviceExtension;
  didNumbers: string[];
}

export interface DeviceExtension {
  ext?: string;
  id: number;
  orgUuid?: string;
  sipAccount: SIPAccount;
}

export interface SIPAccount {
  username: string;
  password: string;
  domain: string;
  domainBackup: null;
  registrationInterval: string;
  codec: string;
  rtpPort: string;
  stunServer: string;
}

export interface DirectRoutingOrg {
  anyNodeDomain?: string;
  anynodeInfo: AnynodeInfo;
  orgUuid?: string;
  dnsTxtRecordValue: string;
}

export interface AnynodeInfo {
  anyNodeDomain?: string;
  addressOfRecordMode: AddressOfRecordMode;
  orgUuid?: string;
  status: string;
}

export interface DirectRoutingReq {
  anyNodeDomain?: string;
  addressOfRecordMode?: AddressOfRecordMode;
  dnsTxtRecordValue?: string;
  teamId?: string;
}

export interface ProvisionToAnyNodeReq {
  sipUsername?: string;
}

export enum AddressOfRecordMode {
  extKey = 'extKey',
  did = 'did',
  systemDefined = 'systemDefined'
}
