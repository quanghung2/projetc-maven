export interface JobBulkFilterReq {
  email?: string; // email to receive result when done. Set null to skip receiving result over email
  numbers: string[]; // max 50,000 numbers. Numbers not in e.164 that looks like SG numbers will be treated as SG numbers
  // "96918851" sample is valid non-e164 SG number
  // "+6596918851" sample is valid e164 SG number
  // "+84123456789" sample is other country number (DNC will not be checked; consent will be checked)
  // "123456" sample is treated as +123456 and only consent will be checked.
}

export class JobBulkFilter {
  bulkUuid: string;
  email: string;
  size: number;
  charged: number; // charge applies only for SG number and PDPC query not on the same day (SGT)
  created: number;
  completed: number; // null if job is still pending

  constructor(obj?: Partial<JobBulkFilter>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get status() {
    return this.completed ? 'Completed' : 'Pending';
  }
}
