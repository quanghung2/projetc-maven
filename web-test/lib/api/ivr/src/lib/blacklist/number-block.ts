export class BlockedNumber {
  workFlowUuid: string;
  number: string;
  createdAt: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
