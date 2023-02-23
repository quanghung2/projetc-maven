import { HashMap } from '@datorama/akita';

export interface DetectRoutingReq {
  domain: string;
  orgUuid: string;
  source: string;
  dest: string;
  type: 'call_incoming' | 'call_outgoing' | 'fax_incoming' | 'fax_outgoing';
}

export interface IsdnInventory {
  clid: boolean;
  dnis: boolean;
}

export interface DetectRoutingRes {
  isdnInventory: IsdnInventory;
  routingPlan: string;
  sku: HashMap<string>;
  supplier: string;
}
