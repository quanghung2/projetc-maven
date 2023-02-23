import { ComplianceAction, EntityStatus, ExtensionRole, ExtType, IncomingAction, RingMode } from '../../enums';
import { CfConfig } from './cf-config.model';
import { CrConfig } from './cr-config.model';
import { ExtDevice } from './device.model';
import { MailBox } from './mail-box.model';
import { Pin } from './pin.model';
import { RingConfig } from './ring-config.model';
import { UsageControl } from './usage-control';

export enum OtherCallerIdType {
  random_callerid = 'random-callerid',
  private = 'private'
}

export interface TransferCallerIdConfig {
  allowPrivateCallerId: boolean;
  allowAutoCallerId: boolean;
  internal: string;
  external: string;
  forwardInternal: string;
  forwardExternal: string;
  assignedCallerIds: string[];
}

export enum SipGwForwardType {
  extensionKey = 'extensionKey',
  callerId = 'callerId'
}

export interface Destination {
  dest: string;
}

export class ExtensionBase {
  extKey: string;
  extKeyInNumber: number;
  extLabel: string;
  dests: Destination[] = [];
  identityUuid: string;
  callerId: string | OtherCallerIdType;
  type: ExtType;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.extKeyInNumber = +this.extKey;
    }
  }

  get displayText() {
    if (this.extLabel) {
      return `${this.extLabel} (#${this.extKey})`;
    } else {
      return `Extension ${this.extKey} (#${this.extKey})`;
    }
  }

  get isCallcenter() {
    return this.type === ExtType.CALL_CENTER;
  }
}

export interface CdConfig {
  extList: string[];
  ringMode: RingMode;
  ringTime: number;
  busyRef: 'busy' | 'hangup';
  unansweredRef: 'unanswered' | 'hangup';
  bypassInternalCall: boolean;
  bypassWhitelist: boolean;
}

export enum RuleAction {
  block = 'block',
  gothrough = 'gothrough',
  ringDevices = 'ringDevices',
  delegate = 'delegate',
  forward = 'forward'
}

export type RuleType = 'startWith' | 'exactMatch';

export interface FilterRule {
  internal: RuleAction.gothrough | RuleAction.ringDevices;
  anonymous: RuleAction.block | RuleAction.gothrough;
  customRules: Rule[];
}
export interface Rule {
  type: RuleType;
  startWith?: string[];
  exactMatch?: string[];
  action: RuleAction;
}

export class Extension extends ExtensionBase {
  outgoingCallRule: string;
  enablePinLogin: boolean;
  enableUsageControl: boolean;
  enableAndroidBackgroundMode: boolean;
  usageControl: UsageControl;
  mailBox: MailBox;
  incomingAction: IncomingAction;
  crConfig: CrConfig;
  cfConfig: CfConfig;
  ringConfig: RingConfig; // ring config for devices with v2
  sipGWUserName: string;
  pin: Pin; // {usingPin: true/false, passCode: '1234'}
  status: string;
  consentAction: ComplianceAction;
  dncAction: ComplianceAction;
  role: ExtensionRole; // CallCenter attribute
  localSipServerIp: string;
  devices: ExtDevice[] = [];
  allowedCallerIds: string[];
  transferCallerIdConfig: TransferCallerIdConfig;
  sipGWForwardDnis: SipGwForwardType;

  incomingCallRule: string;
  incomingFilterRule: FilterRule;
  enableDebugMode: boolean;
  createdTime: string;
  ableToUseVoiceMail: boolean;
  isByoi: boolean;
  cdConfig: CdConfig;

  // mapped to v2 config
  constructor(obj?: Partial<Extension>) {
    super(obj);

    Object.assign(this, obj);

    if (obj) {
      if (obj.mailBox) {
        this.mailBox = new MailBox(obj.mailBox);
        this.mailBox.version = 'v2';
      }
      if (obj.crConfig) {
        this.crConfig = new CrConfig(obj.crConfig);
      }
      if (obj.ringConfig) {
        this.ringConfig = { ...obj.ringConfig, version: 'v2' };
      }
      if (obj.cfConfig) {
        this.cfConfig = { ...obj.cfConfig, version: 'v2' };
      }
      if (obj.devices) {
        this.devices = obj.devices.map(d => new ExtDevice(d));
      }
    }
  }

  get activeDevices() {
    return this.devices.filter(d => d.status === EntityStatus.ACTIVE);
  }
}

/**
 * A factory function that creates Extension
 */
export function createExtension(params: Partial<Extension>) {
  return {} as Extension;
}

export enum EnumTransferCallerIdOption {
  EXT_KEY = 'EXT_KEY',
  CALLER_NUMBER = 'CALLER_NUMBER',
  ASSIGNED_CALLERID = 'ASSIGNED_CALLERID'
}

export interface GetAllExtsParams {
  filterDelegable?: string;
  filterGroupable?: string;
}
