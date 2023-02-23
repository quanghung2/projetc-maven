export class Source {
  number: string;
  workflowUuid: string;
  workflowLabel: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
