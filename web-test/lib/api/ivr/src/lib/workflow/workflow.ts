import { Rule, RuleDestination, RuleType } from './rule';

export enum WorkflowStatus {
  active = 'active',
  inactive = 'inactive',
  draft = 'draft',
  pending = 'pending',
  scheduled = 'scheduled',
  preparing = 'preparing' /*cloning*/,
  deleting = 'deleting',
  all = 'all'
}

export enum ActionType {
  create = 'create',
  rename = 'rename',
  assign = 'assign',
  unassign = 'unassign'
}

export interface Author {
  checker: string;
  checkerUuid: string;
  marker: string;
  markerUuid: string;
}

export class WorkflowVersion {
  workFlowUuid: string;
  version: number;
  orgUuid: string;
  workFlowName: string;
  status: WorkflowStatus;
  releaseNote: string;
  destinations: { [TKey in RuleType]: RuleDestination };
  scheduledAt: number;
  createdAt: number;
  name: string;
  author: Author;

  constructor(obj?: Partial<WorkflowVersion>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  sort(arg0: (a: any, b: any) => number) {
    throw new Error('Method not implemented.');
  }
}

export interface ISDNNumberInfo {
  isDevice: boolean;
  number: string;
}

export class Workflow {
  uuid: string;
  label: string;
  numbers: string[] = [];
  rule: Rule;
  enableCallRecording: boolean;
  status: WorkflowStatus;
  updatedAt: number | string;
  version: number;
  subscriptionUuid: string;
  scheduledAt: number;
  numberList: ISDNNumberInfo[]; //get single

  get numbersInString() {
    return this.numbers.join(', ');
  }

  get firstNumber() {
    return this.numbers.length > 0 ? this.numbers[0] : null;
  }

  get displayText() {
    return this.numbers.length === 0
      ? this.label
      : this.numbers.length === 1
      ? `${this.label} (${this.numbers[0]})`
      : `${this.label} (${this.numbers.length} numbers)`;
  }

  constructor(obj?: Partial<Workflow>) {
    if (obj) {
      Object.assign(this, obj);
      this.numbers = this.numbers || [];
      if ('rule' in obj) {
        this.rule = new Rule(obj.rule);
      }
    }
  }
}

export class BodyRequestTestCallFlow {
  callerId: string;
  dialingNumber: string;
  domain: string;
  orgUuid: string;
}
