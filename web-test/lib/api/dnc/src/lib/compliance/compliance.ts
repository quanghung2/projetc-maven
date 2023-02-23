export class Compliance {
  orgUuid: string;
  callerIdExceptionRule: string[];
}

export interface StatusDncCompliance {
  isCompliant: boolean;
  callerIdExclusions: string[];
}
