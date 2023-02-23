import { getTime } from 'date-fns';
import { format } from 'date-fns-tz';

export enum TypeRequestLeave {
  AM = 'AM',
  PM = 'PM',
  FULL = 'FULL'
}

export enum TypeLeave {
  ANNUAL = 'ANNUAL',
  SICK = 'SICK',
  HOSPITAL = 'HOSPITAL',
  INCAMP_TRAINING = 'INCAMP_TRAINING',
  COMPASSIONATE = 'COMPASSIONATE',
  MARRIAGE = 'MARRIAGE',
  ADOPTION = 'ADOPTION',
  CHILDCARE = 'CHILDCARE',
  MATERNITY = 'MATERNITY',
  PATERNITY = 'PATERNITY',
  SHARED_PARENTAL = 'SHARED_PARENTAL',
  UNPAID_INFANT_CARE = 'UNPAID_INFANT_CARE',
  OFF_IN_LIEU = 'OFF_IN_LIEU',
  NO_PAY = 'NO_PAY',
  PUBLIC_HOLIDAY = 'PUBLIC_HOLIDAY'
}

export class RequestDetailLeaves {
  period: TypeRequestLeave;
  type: TypeLeave;
  startDate: number;
  endDate: number;

  constructor(obj?: Partial<RequestDetailLeaves>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get displayText() {
    return this.type === TypeLeave.PUBLIC_HOLIDAY ? 'public holiday' : 'leave';
  }
}

export class RequestLeave {
  identityUuid: string;
  timezone: string;
  timezoneMe: string;
  requestLeaves: RequestDetailLeaves[] = [];

  constructor(obj: Partial<RequestLeave>) {
    if (obj) {
      Object.assign(this, obj);
      if (!this.requestLeaves) {
        this.requestLeaves = [];
      }
    }
  }

  get requestLeaveNow() {
    const now = getTime(
      +format(new Date(), 'T', {
        timeZone: this.timezoneMe
      })
    );
    return this.requestLeaves.find(item => {
      return item.startDate <= now && item.endDate >= now;
    });
  }

  pushReqeustLeave(req: RequestDetailLeaves) {
    this.requestLeaves?.push(new RequestDetailLeaves(req));
  }
}

export interface ResponseRequestLeaves {
  identityUuid: string;
  period: TypeRequestLeave;
  type: TypeLeave;
}
