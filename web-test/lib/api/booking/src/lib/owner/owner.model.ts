import { TimeInterval } from '../time-interval.model';

export class AvailabilityRule {
  day: string; // MONDAY,TUESDAY ....
  intervals: string[] = [];
  specificDate: string;

  constructor(obj?: Partial<AvailabilityRule>) {
    if (!!obj) {
      Object.assign(this, obj);
    }
  }

  static of(day: string, intervals: TimeInterval[]): AvailabilityRule {
    const r = new AvailabilityRule();
    r.day = day;
    r.intervals = intervals.map(i => i.toString());
    return r;
  }

  isRepeated(): boolean {
    return !this.specificDate;
  }
}

export class Owner {
  readonly initialized: boolean;
  readonly isOwner: boolean;
  readonly link: string;
  readonly availabilityRules: AvailabilityRule[] = [];
  readonly zoomIntegrated: boolean;
  readonly msTeamsIntegrated: boolean;

  constructor(obj?: Partial<Owner>) {
    if (!!obj) {
      Object.assign(this, obj);
      if (!!this.availabilityRules) {
        this.availabilityRules = (this.availabilityRules as AvailabilityRule[]).map(v => new AvailabilityRule(v));
      }
    }
  }
}

export interface OwnerSetRequest {
  link?: string;
  availabilityRules: AvailabilityRule[];
}
