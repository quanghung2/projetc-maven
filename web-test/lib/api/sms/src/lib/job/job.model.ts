export class RecipientInfo {
  refId: string;
  recipients: RecipientPhone[] = [];
  senderName: string;
  msg: string;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.recipients = this.recipients.map(x => new RecipientPhone(x));
    }
  }
}

export class RecipientPhone {
  dest: string;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface RespRecipientPhone {
  jobId: string;
  refId: string;
  tag: any;
  status: string;
  estimatedCost: number;
  smsUuids: any;
}

export enum ACTION {
  ADD = 'add',
  REMOVE = 'remove'
}
