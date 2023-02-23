import { TimeRange } from '@b3networks/api/ivr';
import { format } from 'date-fns';

export enum Mode {
  preview = 'preview',
  progressive = 'progressive'
}

export enum RingOption {
  agent = 'agent',
  customer = 'customer'
}

export enum Status {
  draft = 'draft',
  published = 'published',
  paused = 'paused',
  finished = 'finished',
  checking = 'checking',
  ready = 'ready',
  scheduled = 'scheduled'
}

export enum CallerIdMode {
  fixed = 'fixed',
  dynamic = 'dynamic'
}

export enum CampaignType {
  'voice' = 'voice',
  'sms' = 'sms',
  'outboundContactCenter' = 'outboundContactCenter'
}

export class CampaignInfo {
  uuid: string;
  status: Status;
  name: string;
  mode: Mode;
  callerIdMode: CallerIdMode;
  ringOption: RingOption;
  callerId: string;
  queueUuid: string;
  ringTime: number;
  previewTime: number;
  byAgent: string;
  checkDnc: boolean;
  numberCount: number;
  createdAt: string;
  updatedAt: string;
  domain: string;
  clonedFromCampaignUuid: string;
  includeCampaignNumbers: boolean;
  listScheduledAt: string[];

  // new cpass
  officeHours: { [key: string]: TimeRange[] };
  type: CampaignType;
  flowUuid: string;
  flowBaseSubscriptionUuid: string;
  message: string; // sms

  // ui
  queueLable: string;
  flowLable: string;
  flowSMSLable: string;

  constructor(obj?: Partial<CampaignInfo>) {
    Object.assign(this, obj);
  }

  get scheduledDisplay() {
    return this.listScheduledAt?.map(x => format(new Date(x), 'yyyy-MM-dd HH:mm'))?.join('\n');
  }

  get actionIconToolTipContent() {
    if (this.checkDnc && this.status === Status.draft) {
      return 'Check DNC';
    } else if (this.status === Status.published) {
      return 'Pause';
    } else if (this.status === Status.paused) {
      return 'Resume';
    } else {
      return 'Start';
    }
  }

  get actionIconToolTipContentIgnoreDNC() {
    if (this.status === Status.published) {
      return 'Pause';
    } else if (this.status === Status.paused) {
      return 'Resume';
    } else {
      return 'Start';
    }
  }

  get isCompleted() {
    return this.status === Status.finished;
  }

  get checkDncAble(): boolean {
    if (this.numberCount > 0) {
      return true;
    }
    return false;
  }

  get publishAble(): boolean {
    if (
      this.numberCount > 0 &&
      ((this.checkDnc && (this.status === Status.ready || this.status === Status.paused)) || !this.checkDnc)
    ) {
      return true;
    }
    return false;
  }

  get publishAbleIgnoreDNC(): boolean {
    if (this.numberCount > 0) {
      return true;
    }
    return false;
  }

  get unstartCampaignReason(): string {
    let msg = '';
    if (this.numberCount === 0) {
      msg += 'You need to add number';
    }

    // if (!this.queueUuid) {
    //   msg += '\n Queue cannot be empty';
    // }
    return msg;
  }

  public get previewTimeInString() {
    if (this.mode === Mode.preview) {
      return this.previewTime;
    }

    return 'n/a';
  }
}
