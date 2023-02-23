export enum EnumTypeRouting {
  outgoing = 'outgoing',
  isdn_incoming = 'isdn_incoming'
}

export class RoutingConfigModel {
  sipUsername: string;
  type: EnumTypeRouting;
  rule: string;
  forwardTo: string;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum EnumTypeForwardTo {
  extension = 'Extension',
  sip = 'SIP',
  e164 = 'Number'
}
