import { isAfter, subMinutes } from 'date-fns';
import { EventTemplate } from '../template/template.model';

export class BookingEvent {
  id: string;
  status: string; // SCHEDULED
  startTime: number;
  endTime: number;
  description: string;
  inviteeInfo: InviteeInfo;

  constructor(obj?: Partial<BookingEvent>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface InviteeInfo {
  firstName: string;
  lastName: string;
  middleName: string;
  phoneNumber: string;
  email: string;
}

export class MemberBooking {
  identityUuid: string;
  name: string;

  constructor(obj?: Partial<MemberBooking>) {
    if (!!obj) {
      Object.assign(this, obj);
    }
  }
}

export class BookingEventV2 {
  uniqueId: string;
  template: EventTemplate;
  createdDate: number;
  status: string;
  assignee: MemberBooking;

  utcStart: string;
  utcEnd: string;
  inviteeTimeZone: string;
  inviteeInfo: EmbeddedInviteeInfo;
  location: string;
  description: string;

  constructor(obj?: Partial<BookingEventV2>) {
    if (!!obj) {
      Object.assign(this, obj);
      this.template = new EventTemplate(this.template);
      this.assignee = this.assignee ? new MemberBooking(this.assignee) : null;
      this.inviteeInfo = new EmbeddedInviteeInfo(this.inviteeInfo);
    }
  }

  canAssign(): boolean {
    if (this.template.isIndividualType()) {
      return false;
    }

    if (this.status !== 'PENDING' && this.status !== 'SCHEDULED') {
      return false;
    }

    const bufferBefore = this.template.availabilityConfig.bufferBefore;
    const minimumAssignableTime = subMinutes(new Date(this.utcStart), bufferBefore);
    if (isAfter(new Date(), minimumAssignableTime)) {
      return false;
    }

    return true;
  }

  canCancel(): boolean {
    if (this.status !== 'PENDING' && this.status !== 'SCHEDULED') {
      return false;
    }

    const bufferBefore = this.template.availabilityConfig.bufferBefore;
    const minimumCancelableTime = subMinutes(new Date(this.utcStart), bufferBefore);
    if (isAfter(new Date(), minimumCancelableTime)) {
      return false;
    }
    return true;
  }
}

export class EmbeddedInviteeInfo {
  firstName: string;
  lastName: string;
  middleName: string;
  phoneNumber: string;
  email: string;

  constructor(obj?: Partial<EmbeddedInviteeInfo>) {
    if (!!obj) {
      Object.assign(this, obj);
    }
  }

  getFullName(): string {
    let r = '';
    if (this.firstName !== '') {
      r += this.firstName;
    }

    if (this.middleName !== '') {
      if (r.length > 0) {
        r += ' ';
      }
      r += this.middleName;
    }

    if (this.lastName !== '') {
      if (r.length > 0) {
        r += ' ';
      }
      r += this.lastName;
    }
    return r;
  }
}
