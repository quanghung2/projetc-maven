export interface DeviceOTP {
  code: string;
  secToExpire: number;
}

export interface DeviceAccessToken {
  resourceIds: string[];
  orgUuid: string;
  sessionToken?: string;
  deviceId?: string;
}
