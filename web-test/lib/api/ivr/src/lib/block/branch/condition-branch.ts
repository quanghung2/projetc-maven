import { format, parse } from 'date-fns';
import { BlockRef } from './block-ref';
import { UploadEvent } from './gather-branch';

export class ConditionBranch extends BlockRef {
  uploadEvent: UploadEvent;
  uploadIndicator: boolean;
  type: ConditionBranchType = ConditionBranchType.callerIdPattern;
  order: number;
  override startWithList: string[] = [];
  upperLength: number;
  lowerLength: number;
  s3Key: string;
  from: string;
  to: string;
  days: string[];

  expressionTemplate: string;
  entries: ScriptEntry[] = [];

  get fromInDate() {
    switch (this.type) {
      case ConditionBranchType.dateInRange:
        return parse(this.from, 'MMM dd HH:mm', new Date());
      case ConditionBranchType.timeInRange:
        return parse(this.from, 'HH:mm', new Date());
      default:
        return new Date();
    }
  }

  set fromInDate(date: any) {
    if (date) {
      switch (this.type) {
        case ConditionBranchType.dateInRange:
          this.from = format(date, 'MMM dd HH:mm');
          break;
        case ConditionBranchType.timeInRange:
          this.from = format(date, 'HH:mm');
          break;
        default:
          this.from = null;
      }
    }
  }

  get toInDate() {
    switch (this.type) {
      case ConditionBranchType.dateInRange:
        return parse(this.to, 'MMM dd HH:mm', new Date());
      case ConditionBranchType.timeInRange:
        return parse(this.to, 'HH:mm', new Date());
      default:
        return new Date();
    }
  }

  set toInDate(date: any) {
    if (date) {
      switch (this.type) {
        case ConditionBranchType.dateInRange:
          this.to = format(date, 'MMM dd HH:mm');
          break;
        case ConditionBranchType.timeInRange:
          this.to = format(date, 'HH:mm');
          break;
        default:
          this.to = null;
      }
    }
  }

  constructor(obj?: any) {
    super(obj);
    Object.assign(this, obj);
    if (obj && 'entries' in obj) {
      this.entries.entries = obj.entries.map(e => new ScriptEntry(e));
    }
  }
}

export class ScriptEntry {
  context: string;
  script: string;
  result: string;
  operator: ComparisonOperator;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (!this.operator) {
      this.operator = ComparisonOperator.equal;
    }
  }
}

export enum ConditionBranchType {
  callerIdPattern = 'callerIdPattern',
  callerIdInList = 'callerIdInList',
  dateInRange = 'dateInRange',
  timeInRange = 'timeInRange',
  dayOfWeek = 'dayOfWeek',
  validateExpression = 'expression',
  otherwise = 'otherwise'
}

export enum ComparisonOperator {
  equal = 'equal',
  not_equal = 'not_equal'
}
