export enum RuleType {
  officeHour = 'officeHour',
  afterOfficeHour = 'afterOfficeHour',
  publicHoliday = 'publicHoliday'
}

export enum DestinationType {
  extension = 'extension',
  ivrFlow = 'ivrFlow'
}

export class RuleDestination {
  type: DestinationType;
  uuid: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (!this.type) {
      this.type = DestinationType.ivrFlow;
    }
  }
}

export enum WeekDay {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY'
}

export class TimeRange {
  from: string;
  to: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  static createInstance(from, to: string) {
    return new TimeRange({ from: from, to: to });
  }
}

export class ShiftData {
  dayOfWeek: WeekDay;
  timeRanges: TimeRange[] = [];

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class Holiday {
  date: string;
  name: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

export class Rule {
  destinations: { [TKey in RuleType]: RuleDestination };
  shifts: ShiftData[] = [];
  holidayCode: string;
  holidays: Holiday[] = [];
  timezone: string;
  autoImportHolidays: boolean;
  groupHolidayUuid: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
