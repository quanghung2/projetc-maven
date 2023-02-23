import { HashMap } from '@datorama/akita';

export class AuditData {
  userId?: string;
  role?: string;
  ipAddress?: string;
  dateTime?: string;
  action?: string;
  rawAction?: string;
  number?: string;
  target?: string;
  workFlowName?: string;
  tag?: string;
  flowType?: string;
  blockLabel?: string;
  blockType?: string;
  queueLabel?: string;
  isExpanded = false;
  bizPhoneExtensions: any = {};
  wallboardQueues: any = {};
  schedulerGroups: any = {};
  labelMap: any = {};
  oldAudit = false;
  rawData?: any;
  details: Details = new Details();
  constructor(obj?: Partial<AuditData>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Change {
  name: string;
  oldValue: string;
  newValue: string;
  formattedValue?: string;
  constructor(obj?: Partial<Change>) {
    Object.assign(this, obj);
  }
}

export class IvrBlock {
  blockType: string;
  flowType: string;
  id: string;
  label: string;
  isChanged?: boolean;
  isDeleted?: boolean;
  lastModifyTime?: number;
  extensions: Extensions[] = [];
  attempts?: number;
  ivrMsgConf: IvrMsgConf = new IvrMsgConf();
  emailTo?: string;
  enableVoiceMail?: boolean;
  enableMessage?: boolean;
  notifyToCaller?: boolean;
  notifyToLastInputNumber?: boolean;
  displayCallee?: boolean;
  dest?: string;
  ringTime?: number;
  conditions: Condition[] = [];
  command: WebhookCommand = new WebhookCommand();
  expectedResponses: ExpectedResponse[] = [];
  nextStep?: string;
  toStep?: string;
  goTimes?: number;
  callerIdPrefix?: string;
  urlTo?: string;
  smsTo?: string;
  smsTemplate?: string;
  smsSender?: string;
  smsPlan?: string;
  startNumber?: string;
  timeout?: number;
  note?: string;
  data?: SSOData;
  constructor(obj?: Partial<IvrBlock>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Extensions {
  digits?: string;
  mappingDigits?: any[];
  mappingUrl?: string;
  maxDigit?: number;
  needMonitor?: string;
  nextStep?: string;
  tag?: string;
  constructor(obj?: Partial<Extensions>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class IvrMsgConf {
  languageCode = 'en';
  message = '';
  playType = 'TTS';
  mp3Url = '';
  constructor(obj?: Partial<IvrMsgConf>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Condition {
  condition?: string;
  nextStep?: string;
  constructor(obj?: Partial<Condition>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ExpectedResponse {
  expectedResponse?: string;
  nextStep?: string;
  constructor(obj?: Partial<ExpectedResponse>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class WebhookCommand {
  url = '';
  method = 'post';
  dataType = 'application/json';
  params: any = {};
  headers: any = {};
  constructor(obj?: Partial<WebhookCommand>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Details {
  commonList: Common[] = [];
  changeList: Change[] = [];
  constructor(obj?: Partial<Details>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Common {
  name: string;
  value: string;
  constructor(obj?: Partial<Common>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class SSOData {
  host?: string;
  maxDigits: string[] = [];
  timeouts: string[] = [];
  messages: IvrMsgConf[] = [];
  attempts: string[] = [];
  retries: Retry[] = [];
  constructor(obj?: Partial<SSOData>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Retry {
  condition?: string;
  maxTimes?: number;
  message: IvrMsgConf = new IvrMsgConf();
  constructor(obj?: Partial<Retry>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export const FieldChangeDirectline: HashMap<string> = {
  addNewNumbersToBlockList: 'numbers',
  importFromRecentCallsToBlockList: 'numbers',
  removeNumberFromBlockList: 'number',
  editForwardConfig: 'forwardNumber',
  editLabel: 'label'
};

export const FieldChange: HashMap<string> = {
  updateCallerId: 'defaultCli',
  addIpWhiteList: 'ips',
  addCountryWhiteList: 'countries',
  updateCompliance: 'action',
  updateType: 'type',
  copyPassword: 'password',
  createDialPlan: 'dialPlanList',
  deleteDialPlan: 'dialPlanList',
  disableBackupLine: 'sipDomain',
  updateLabel: 'label',
  enableBackupLine: 'sipDomain',
  removeCountryWhiteList: 'country',
  removeIpWhiteList: 'ip',
  updatePassword: 'password',
  rearrangeDialPlan: 'dialPlanList',
  enabledIncomingPinLogin: 'status',
  enabledOutgoingPinLogin: 'status',
  disabledOutgoingPinLogin: 'status',
  disabledIncomingPinLogin: 'status',
  updateDialPlan: 'dialPlanList'
};

export const FieldChangeBizPhone: HashMap<string> = {
  assignDID: 'ext',
  unassignDID: 'ext',
  deleteExt: 'ext',
  toggleDebugMode: 'enableDebugMode',
  togglePasscode: 'pin',
  togglePinLogin: 'enablePinLogin',
  updateCallRecordingConfig: 'crConfig',
  updateExtensionKey: 'ext',
  updateExtensionLabel: 'extLabel',
  externalTransferCallerId: 'externalTransferCallerIdOption',
  internalTransferCallerId: 'internalTransferCallerIdOption',
  callerid: 'callerId',
  updateOutboundRule: 'outboundRule',
  updatePickupPrefix: 'pickupPrefix'
};
