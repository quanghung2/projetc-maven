import { HashMap } from '@datorama/akita';
import { PopupShowedOn } from '../agent/agent-config';
import { AssignedTxn } from '../me/me.model';
import { TxnType } from '../txn/model/txn.enum';
import { Transfer2GenieConfig } from './../queue/queue.model';

export interface TimeRange {
  from: string;
  to: string;
}
export class CrmField {
  fieldName: string;
  fieldDisplay: string;
  fieldValue: any;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class CrmHeaderField {
  fieldName: string;
  fieldValue: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class CrmIntegration {
  url: string;
  fields: CrmField[];
  headerFields: CrmHeaderField[];

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.fields = this.fields ? this.fields.map(f => new CrmField(f)) : [];
      this.headerFields = this.headerFields ? this.headerFields.map(h => new CrmHeaderField(h)) : [];
    }
  }
}

export class PopupField {
  fieldName: string;
  fieldValue: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
export class PopupConfig {
  defaultPopupShowedOn: PopupShowedOn;
  /*  support 5 type dialog:
    crossAppIn, Direct Inbound Calls
    crossApp, Direct Outbound Calls
    callback, Call Center Scheduled Call Backs
    incoming, Call Center Inbound Calls
    autodialer, Call Center Outbound Calls
   */
  callTypeToShowPopup: TxnType[];
  popupFields: PopupField[];

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.popupFields = this.popupFields ? this.popupFields.map(f => new PopupField(f)) : [];
    }
  }

  canShowPopup(assignedTxn: AssignedTxn) {
    if (!assignedTxn) {
      return false;
    }

    const type = assignedTxn.typeShowPopup;
    return this.callTypeToShowPopup && type ? this.callTypeToShowPopup.includes(type) : false;
  }
}

export class OrgConfig {
  defaultWrapUpTimeInSeconds: number;
  defaultSmsPerCallerInDay: number;
  awayDetectionUnansweredThreshold: number;
  minimumRingTimeInSeconds: number;
  remarks: string[];
  crmIntegration: CrmIntegration;
  popupConfig: PopupConfig;
  transfer2GenieConfig: HashMap<Transfer2GenieConfig>;
  outboundConcurrentCallLimit: number;
  outboundConcurrentCallUsage: number;
  officeHours: Array<TimeRange[]>;
  enableCasesFeature: boolean;
  callParkingConfig: CallParkingConfig;
  thresholdConfig: Threshold;
  changeAgentStatusPrefix: string;
  pickupPrefix: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.crmIntegration) {
        this.crmIntegration = new CrmIntegration(obj.crmIntegration);
      }
      if (obj.popupConfig) {
        this.popupConfig = new PopupConfig(obj.popupConfig);
      }
    }
  }
}

export interface CallParkingConfig {
  parkingtime: number;
  prefix: string;
}

export interface Threshold {
  unreachableThreshold?: number;
  agentSLAThreshold?: number;
}
