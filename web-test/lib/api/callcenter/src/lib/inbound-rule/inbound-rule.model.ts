import { EntityStatus } from '../outbound-rule/outbound-rule.model';

export class InboundRule {
  id: number;
  orgUuid: string;
  name: string;
  type: string;
  numberConfig: NumberConfig;
  inboundRulePlans: InboundRulePlan[];
  createdAt: null;
  updatedAt: Date;
  status: EntityStatus;

  constructor(obj?: Partial<InboundRule>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface InboundRulePlan {
  id: number;
  startWith: string[];
  numberLength: string[];
  removePrefix: number;
  appendPrefix: string;
  doPrependPlus?: boolean;
}

export interface NumberConfig {
  numbers: any[];
  regex: null;
}

export interface CreateOrUpdateInboundRuleReq {
  name?: string;
  type?: 'accept' | 'reject';
  inboundRulePlans?: InboundRulePlan[];
  status?: EntityStatus;
}

export interface InboundRulePlan {
  startWith: string[];
  numberLength: string[];
  removePrefix: number;
  appendPrefix: string;
}
