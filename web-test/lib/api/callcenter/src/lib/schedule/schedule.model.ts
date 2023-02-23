import { ShiftData } from '@b3networks/api/ivr';

export interface ScheduleUW {
  identityUuid: string; // id
  phCountryCode: string;
  timezone: string;
  shifts: ShiftData[];
  groupHolidayUuid?: string;
}

export interface ScheduleStatusResp {
  status: 'officeHour' | 'nonOfficeHour' | 'publicHoliday';
}
