export class ApproveVersion {
  ipAddress?: string;
  version?: string;
  note?: string;
  scheduleTime?: string;
  constructor(obj?: Partial<ApproveVersion>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
