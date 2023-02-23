export interface Device {
  id: number;
  orgUuid: string;
  name?: string;
  deviceUuid: string;
  ext: string;
  extLabel?: string;
  extType?: string;
  isProvision: boolean;
  pushToken?: any;
  deviceOS: string;
  provisioned: boolean;
  createdTime: number;
  status: string;
  codec?: string;
  securityPassword?: string;
}

export function createDevice(params: Partial<Device>) {
  return params as Device;
}

export interface AutoProvisionJob {
  createdTime: number;
  status: string;
  id: number;
  orgUuid: string;
  jobStatus: 'WAITING' | 'DONE' | 'ERROR';
  action: string;
  errMsg: string;
}
