export interface Customer {
  phone: string;
}

export enum CallFlowStepType {
  dial = 'dial',
  connect = 'connect'
}

export class CallFlowStep {
  type: CallFlowStepType;
  destination: string;
  callerID: string;

  constructor(obj?: Partial<CallFlowStep>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  static dial2Extension(ext: string) {
    return new CallFlowStep({
      type: CallFlowStepType.dial,
      destination: `$.exts['${ext}']`,
      callerID: '$.customer.phone'
    });
  }

  static dial2InternalExtension(source: string, dest: string) {
    return new CallFlowStep({
      type: CallFlowStepType.dial,
      destination: `$.exts['${source}']`,
      callerID: `$.exts['${dest}'].callerId`
    });
  }

  static connect2Customer(ext: string) {
    return new CallFlowStep({
      type: CallFlowStepType.connect,
      destination: '$.customer.phone',
      callerID: `$.exts['${ext}'].callerId`
    });
  }

  static connect2Extension(source: string, dest: string) {
    return new CallFlowStep({
      type: CallFlowStepType.connect,
      destination: `$.exts['${dest}']`,
      callerID: `$.exts['${source}'].callerId`
    });
  }
}

export class CallFlow {
  steps: CallFlowStep[];

  constructor(obj?: Partial<CallFlow>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class MakeCallReq {
  customers: Customer[];
  callflow: CallFlow;

  constructor(obj?: Partial<MakeCallReq>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
