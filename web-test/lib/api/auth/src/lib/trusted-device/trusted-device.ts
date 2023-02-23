export class TrustedDeviceInfo {
  uuid: number;
  data: number;
  createdDateTime: number;
}

export class TrustedDeviceResponse {
  totalCount: number;
  trustedDevices: TrustedDeviceInfo[];
}
