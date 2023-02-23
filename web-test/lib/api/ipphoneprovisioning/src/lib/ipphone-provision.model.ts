import { EnumProtocolSIP, EnumServerPortSIP } from '@b3networks/api/bizphone';

export enum IpPhoneBrand {
  yealink = 'yealink',
  fanvil = 'fanvil'
}

export interface IPPhoneProvision {
  brand: IpPhoneBrand;
  model: string;
  version: string;
  s3Key: string;

  // clone
  fromBrand?: string;
  fromModel?: string;
}

export interface SampleData {
  username: string;
  password: string;
  domain: string;
  label: string;
  timezone: string;
  codec: string;
  port: EnumServerPortSIP;
  protocol: EnumProtocolSIP;
  stunServer: string;
}
