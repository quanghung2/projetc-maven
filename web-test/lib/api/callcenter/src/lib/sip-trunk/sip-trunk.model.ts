import { HashMap } from '@datorama/akita';

export enum FailOverType {
  sipEndpoint = 'sipEndpoint',
  backupNumber = 'backupNumber'
}

export interface IncomingFailoverConfig {
  strategy: FailOverType;
  // manual
  active?: boolean;
  defaultBackupNumber?: string;
  backupNumbers?: HashMap<string>;

  // auto
  sipUsername?: string;
  sipDomain?: string;
}

export enum TypeSipAccount {
  SIP_TRUNK = 'SIP_TRUNK',
  BYOC_TRUNK = 'BYOC_TRUNK'
}

export class SipAccount {
  id: string;
  type: TypeSipAccount;
  orgUuid: string;
  sipAccount: {
    username: string;
    domain: string;
    serverPort: string;
    protocol: string;
    registrationInterval: string;
    codec: string;
    stunServer: string;
    enableIpv6: boolean;
  };
  outgoingCallRule: number;
  incomingCallRule: number;
  callerIdConfig: {
    defaultCallerId: string;
    mode: CallerIdOptionMode;
  };
  createdTime: string;
  status: 'ACTIVE' | string;
  ipWhiteList: any[];

  incomingFailoverConfig?: IncomingFailoverConfig;
  detail: DetailSipAccount;

  // fetch api
  numbers: string[];
  isHA: boolean;
  isIP: boolean;

  constructor(obj?: Partial<SipAccount>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get sipUsername() {
    return this.sipAccount?.username || this.id;
  }

  get displayNumbers() {
    return this.numbers?.length > 1 ? this.numbers?.join(' \n ') : '';
  }

  get displayName() {
    const label = this.detail?.label ? this.detail.label + ' - ' : '';
    const number =
      this.numbers?.length === 0 || !this.numbers
        ? ''
        : this.numbers?.length === 1
        ? `(${this.numbers[0]})`
        : `(${this.numbers?.length} numbers)`;
    return `${label}${this.sipUsername} ${number}`;
  }

  get labelAndNumber() {
    const label = this.detail?.label ? this.detail.label : '';
    const number =
      this.numbers?.length === 0 || !this.numbers
        ? ''
        : this.numbers?.length === 1
        ? `- (${this.numbers[0]})`
        : `- (${this.numbers?.length} numbers)`;
    return `${label} ${number}`;
  }
}

export interface RoutingConfigSip {
  forwardTo: string;
  number: string;
}

export enum CallerIdOptionMode {
  NORMAL = 'NORMAL',
  SIP_NUMBER = 'SIP_NUMBER',
  PBX = 'PBX'
}

export interface DetailSipAccount {
  type: string;
  username: string;
  domain: string;
  password: string;
  oldPasswords: string[];
  label: string;
  status: string;
  capacity: string;
  owner: {
    uuid: string;
    name: string;
    email: string;
  };
  cps: number;
  publicIp: any;
  localIp: any;
  handleIsdnIncoming: boolean;
  numbers: any[];
  config: Config;
  subscriptionUuid: string;
  enterprise: boolean;
}

export enum AuthenticationMode {
  ACCOUNT = 'ACCOUNT',
  IP = 'IP'
}

export interface Config {
  callerId: string;
  ipWhiteList: any[];
  countryWhiteList: any[];
  authenticationMode: AuthenticationMode;
  ipPeers: any[];
  callerIdPrepend: null;
  callerIdRules: null;
}

export interface ReqUpdateIpPeer {
  ip?: string;
  protocol?: string;
  port?: string;
}
