export interface UsableInjectionTokensList {
  previousActionUuid: string;
  tokens: string[];
}

export interface SubscriptionForProject {
  subUuid: string;
  numberOfConcurrentCallAddOns: number;
  assignedNumbers: string[];
}

export interface FlowVersionMapping {
  activeVersion: number;
  flowUuid: string;
  flowName: string;
  versions: number[];
}
