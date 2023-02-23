export class LoginHistory {
  data: DataLoginHistory[] = [];
  nextCursor: string;

  constructor(obj?: Partial<LoginHistory>) {
    if (obj) {
      Object.assign(this, obj);
    }
    if (this.data) {
      this.data = this.data.map(item => new DataLoginHistory(item));
    }
  }
}

export class DataLoginHistory {
  deviceType: string;
  country: string;
  ipAddress: string;
  userAgent: string;
  failureCause: string;
  uuid: string;
  email: string;
  status: string;
  successful: boolean;
  time: number;
  end: number;
  begin: number;
  number: string;

  get duration() {
    return this.end - this.begin;
  }

  constructor(obj?: Partial<DataLoginHistory>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
