export class RollbackVersion {
  ipAddress?: string;
  version?: string;
  constructor(obj?: Partial<RollbackVersion>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
