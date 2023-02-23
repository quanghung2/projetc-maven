export class ChangeSchedule {
  ipAddress?: string;
  shifts: Shift[] = [];
  constructor(obj?: Partial<ChangeSchedule>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class Shift {
  dayOfWeek?: string;
  timeRanges: TimeRange[] = [];
  timeRangesStr: string = '';
  isRestDay: boolean = false;
  constructor(obj?: Partial<Shift>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class TimeRange {
  from?: string;
  to?: string;
  constructor(obj?: Partial<TimeRange>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
