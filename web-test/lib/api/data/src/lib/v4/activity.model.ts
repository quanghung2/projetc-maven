export class ActivityReport {
  agentUuid: string;
  agent: string;
  availableDuration: string;
  busyDuration: string;
  offlineDuration: string;
  awayDuration: string;

  constructor(obj?: Partial<ActivityReport>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ActivityLog {
  agentUuid: string;
  agent: string;
  status: string;
  remark: string;
  from: string;
  to: string;
  duration: string;

  constructor(obj?: Partial<ActivityLog>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
