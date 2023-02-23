import { DeviceType } from 'libs/api/bizphone/src/lib/enums';

export interface Device {
  id: number;
  orgUuid: string;
  deviceId: string;
  ext: string;
  msisdnNumber: number;
  sipAccount: SIPAccount;
  msTeam: string;
  deviceType: DeviceType;
  createdTime: Date;
  status: string;
  sessionToken: string;
  deviceInfo: DeviceInfo;
  legacyMsTeam: boolean;
  msTeamWithTenant: boolean;
  isPrimary: boolean | null;
}

export interface DeviceInfo {
  deviceName: string;
  deviceToken: string;
}

export interface SIPAccount {
  username: string;
  password: string;
  domain: string;
  serverPort: string;
  protocol: string;
  registrationInterval: number;
  codec: string;
  stunServer: string;
  enableIpv6: boolean;
}

export interface UpdateRegisteredDeviceReq {
  deviceId: string;
  deviceName: string;
}
