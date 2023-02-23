export interface Account {
  capacity: string;
  config: AccountConfig;
  cps: number;
  domain: string;
  enterprise: boolean;
  handleIsdnIncoming: boolean;
  label: string;
  localIp: string;
  numbers: any[];
  owner: AccountOwner;
  password: string;
  publicIp: string;
  status: string;
  subscriptionUuid: string;
  type: string;
  username: string;
}

export interface AccountConfig {
  authenticationMode: string;
  callerId: string;
  callerIdPrepend: any;
  callerIdRules: string;
  countryWhiteList: string[];
  ipPeers: IPPeer[];
  ipWhiteList: string[];
}

export interface IPPeer {
  handleIncomingCall: boolean;
  ip: string;
  port: string;
  protocol: string;
}

export interface AccountOwner {
  email: string;
  name: string;
  uuid: string;
}
