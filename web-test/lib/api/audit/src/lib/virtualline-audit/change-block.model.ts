import { Change } from '../common/common-audit.model';

export class ChangeBlock {
  ipAddress?: string;
  action?: string;
  officeHour?: string;
  blockName?: string;
  blockType?: string;
  bizPhoneData: BizPhoneData = new BizPhoneData();
  callCenterData: CallCenterData = new CallCenterData();
  details: ChangeBlockDetails = new ChangeBlockDetails();
  fieldChanges: Change[] = [];
  constructor(obj?: Partial<ChangeBlock>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class BizPhoneData {
  extensions: Extension[] = [];
  extensionGroups: ExtensionGroup[] = [];
  conferenceRooms: ConferenceRoom[] = [];
  constructor(obj?: Partial<BizPhoneData>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Extension {
  extKey?: string;
  extLabel?: string;
  constructor(obj?: Partial<Extension>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ExtensionGroup {
  extGroupKey?: string;
  name?: string;
  constructor(obj?: Partial<ExtensionGroup>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ConferenceRoom {
  roomNumber?: string;
  constructor(obj?: Partial<ConferenceRoom>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class CallCenterData {
  queues: Queue[] = [];
  constructor(obj?: Partial<CallCenterData>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Queue {
  uuid?: string;
  label?: string;
  constructor(obj?: Partial<Queue>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ChangeBlockDetails {
  action?: string;
  oldData: Block = new Block();
  newData: Block = new Block();
  constructor(obj?: Partial<ChangeBlockDetails>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Block {
  type?: string;
  label?: string;
  tts: any = {};
  nextBlocks: any[] = [];
  variables: any = {};
  attempts?: string;
  timeout?: string;
  maxDigits?: string;
  goTimes?: string;
  goBlock: any = {};
  email: any = {};
  sms: any = {};
  emailType?: string;
  smsType?: string;
  ringTime?: string;
  dest: any = {};
  callerIdStrategy: any = {};
  enableVoiceMail?: string;
  webHookCommand: any = {};
  constructor(obj?: Partial<Block>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
