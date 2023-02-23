import { AvailabilityRule } from '../owner/owner.model';

export class EventTemplate {
  type: string;
  readonly uniqueId: string;
  name: string;
  link: string;
  queueUuid: string;
  preAssignTo: string;

  additionalInfo: ETAdditionalInfo;
  duration: number;
  dateRange: ETDateRange;
  availabilityConfig: ETAvailabilityConfig;
  reminderConfig: ETReminderConfig;
  rescheduleAllowed: boolean;
  cancelAllowed: boolean;
  concurrentEvents: number;

  locations: ETLocation[] = [];

  constructor(obj?: Partial<EventTemplate>) {
    if (!!obj) {
      Object.assign(this, obj);
      this.additionalInfo = new ETAdditionalInfo(this.additionalInfo);
      this.dateRange = new ETDateRange(this.dateRange);
      this.availabilityConfig = new ETAvailabilityConfig(this.availabilityConfig);
      this.reminderConfig = new ETReminderConfig(this.reminderConfig);
      this.locations = (this.locations as ETLocation[]).map(v => new ETLocation(v));
    }
  }

  isIndividualType(): boolean {
    return this.type === 'INDIVIDUAL';
  }
}

export class ETAdditionalInfo {
  description: string;
  eventColor: string;

  constructor(obj?: Partial<ETAdditionalInfo>) {
    if (!!obj) {
      Object.assign(this, obj);
    }
  }
}

export class ETDateRange {
  type: string; // ROLLING_DAYS, DATE_RANGE, INDEFINITELY
  rollingDays: number;
  fromDate: string; // yyyy-mm-dd
  toDate: string; // yyyy-mm-dd

  constructor(obj?: Partial<ETDateRange>) {
    if (!!obj) {
      Object.assign(this, obj);
    }
  }
}

export class ETAvailabilityConfig {
  rules: AvailabilityRule[] = [];
  availabilityIncrement: number;
  maxEventsPerDay: number;
  minimumSchedulingNotice: number;
  bufferBefore: number;
  bufferAfter: number;

  constructor(obj?: Partial<ETAvailabilityConfig>) {
    if (!!obj) {
      Object.assign(this, obj);
      this.rules = (this.rules as AvailabilityRule[]).map(v => new AvailabilityRule(v));
    }
  }
}

export class ETReminderConfig {
  emailReminderEnabled: boolean;
  emailReminderTimings: string[] = [];

  textReminderEnabled: boolean;
  textReminderTimings: string[] = [];

  constructor(obj?: Partial<ETReminderConfig>) {
    if (!!obj) {
      Object.assign(this, obj);
    }
  }
}

export class ETLocation {
  readonly type: 'ZOOM' | 'MS_TEAMS' | 'CUSTOM' | 'ASK_INVITEE';
  customLocation: string;
  isDefault: boolean;

  constructor(obj?: Partial<ETLocation>) {
    if (!!obj) {
      Object.assign(this, obj);
    }
  }
}

export interface CreateTemplateRequest {
  type: string;
  name: string;
  queueUuid?: string;

  additionalInfo: ETAdditionalInfo;
  duration: number;
  dateRange: ETDateRange;
  availabilityConfig: ETAvailabilityConfig;
  reminderConfig: ETReminderConfig;
  rescheduleAllowed: boolean;
  cancelAllowed: boolean;
  concurrentEvents: number;
}

export interface UpdateTemplateRequest {
  name: string;
  link: string;
  queueUuid?: string;
  preAssignTo?: string;

  additionalInfo: ETAdditionalInfo;
  duration: number;
  dateRange: ETDateRange;
  availabilityConfig: ETAvailabilityConfig;
  reminderConfig: ETReminderConfig;
  rescheduleAllowed: boolean;
  cancelAllowed: boolean;
  concurrentEvents: number;
}
