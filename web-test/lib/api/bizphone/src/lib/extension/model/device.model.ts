import { STUN_SERVER } from '@b3networks/shared/common';
import { DeviceType, EntityStatus } from '../../enums';

export enum EnumProtocolSIP {
  tcp = 'tcp',
  tls = 'tls'
}

export enum EnumServerPortSIP {
  port5060 = '5060',
  port5061 = '5061'
}

export class ExtDevice {
  orgUuid: string;
  ext: string;
  msisdnNumber: null;
  sipAccount: SIPAccount;
  createdTime: null | string;
  deviceType: DeviceType;
  status: EntityStatus;
  delegatedFrom: string;

  constructor(obj?: Partial<ExtDevice>) {
    if (obj) {
      Object.assign(this, obj);
      this.sipAccount = new SIPAccount(obj.sipAccount);
    }
  }

  get identifier() {
    return this.isDelegated ? `${this.deviceType}_${this.delegatedFrom}` : this.deviceType;
  }

  get isDelegated() {
    return this.deviceType === DeviceType.IP_PHONE && !!this.delegatedFrom;
  }

  get isEnable() {
    return this.status === EntityStatus.ACTIVE;
  }

  get canConfigTLS() {
    return [DeviceType.DESKTOP, DeviceType.IP_PHONE, DeviceType.MOBILE].includes(this.deviceType);
  }
}

export class SIPAccount {
  username: string;
  password: string;
  domain: string;
  domainBackup: null;
  serverPort: EnumServerPortSIP;
  protocol: EnumProtocolSIP;
  registrationInterval: string;
  codec: string;
  rtpPort: string;
  stunServer: string;
  featureCodes: FeatureCode[];
  enableIpv6: boolean;

  constructor(obj?: Partial<SIPAccount>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  //protocol=tls & serverPort=5061
  get isEnabledTLS() {
    return this.protocol === EnumProtocolSIP.tls && this.serverPort === EnumServerPortSIP.port5061;
  }

  get sipDomainName() {
    if (this.domain) {
      return this.domain.substring(0, this.domain.indexOf('.'));
    }
    return '';
  }

  get isEnabledSTUN() {
    return !!this.stunServer;
  }

  enableTLS() {
    this.protocol = EnumProtocolSIP.tls;
    this.serverPort = EnumServerPortSIP.port5061;
  }

  disableTLS() {
    this.protocol = EnumProtocolSIP.tcp;
    this.serverPort = EnumServerPortSIP.port5060;
  }

  enableSTUN() {
    this.stunServer = STUN_SERVER;
  }

  disableSTUN() {
    this.stunServer = '';
  }

  enableIPv6() {
    this.enableIpv6 = true;
  }

  disableIPv6() {
    this.enableIpv6 = false;
  }
}

export interface FeatureCode {
  label: Label;
  code: Code;
}

export enum Code {
  AttendedTransfer = 'attended_transfer',
  BlindTransfer = 'blind_transfer',
  CancelTransfer = 'cancel_transfer'
}

export enum Label {
  The1 = '##1',
  The2 = '##2',
  The3 = '##3'
}
