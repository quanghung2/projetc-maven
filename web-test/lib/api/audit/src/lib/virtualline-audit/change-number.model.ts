export class ChangeNumbers {
  public ipAddress?: string;
  public action?: string;
  public numbers?: string;
  constructor(obj?: Partial<ChangeNumbers>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
