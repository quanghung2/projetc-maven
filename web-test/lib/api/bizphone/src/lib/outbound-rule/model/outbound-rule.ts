import { EntityStatus } from '../../enums';

export class OutboundRule {
  callerIdPlanList: CallerIdPlan[];
  countryWhiteList: string[];
  createdTime: number;
  dialPlanList: DialPlan[];
  extKeyList: string[];
  id: number;
  name: string;
  orgUuid: string;
  pinWhiteList: string[];
  sipGwList: string[];
  status: EntityStatus;

  constructor(obj?: Partial<OutboundRule>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class DialPlan {
  id: number;
  orgUuid: string;
  gatewayExt: string;
  outGoingCallRuleId: number;
  planDetail: DialPlanDetail;
  status: EntityStatus;
  isEditing: boolean;

  constructor(obj?: Partial<DialPlan>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class DialPlanDetail {
  startWith: string[] = [];
  numberLength: string[] = [];
  removePrefix: number;
  appendPrefix: string;
  sipGatewayEndpoint: string;

  constructor(obj?: Partial<DialPlanDetail>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class CallerIdPlan {
  id: number;
  orgUuid: string;
  outGoingCallRuleId: number;
  phoneCode: string;
  callerId: string;
  prefix: string[];
  status: EntityStatus;

  constructor(obj?: Partial<CallerIdPlan>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface StatusResp {
  status: string;
}

export interface UpdateOutboundRuleResp {
  name: string;
}
