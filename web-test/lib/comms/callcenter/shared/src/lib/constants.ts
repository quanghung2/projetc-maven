import { KeyValue } from '@angular/common';
import { TxnType } from '@b3networks/api/callcenter';

export const MY_FORMATS = {
  parse: {
    dateInput: 'LL'
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    timeInput: 'yyyy-MM-dd HH:mm',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

export const GE_PRODUCTION_ORG_UUIDS = [
  '313d56c4-d844-4905-93fe-959b2512dd58',
  'fc4bee2a-ed4c-4d66-a9f9-57768991a0a9',
  '6ad36c46-54f8-4fed-8cd8-be0866f926aa',
  'f1dfe04a-2424-4aa2-af39-140777834ae0',
  '499f9aa7-fd45-4ead-8b8f-216f62282be7',
  'c0b9969a-938b-4c6a-b592-1b1c641b44d4',
  '70d59538-738d-4377-bada-6cbf1e03e5f0'
];

export const INCOMING: KeyValue<TxnType, string> = { key: TxnType.incoming, value: 'Incoming' };
export const CALLBACK: KeyValue<TxnType, string> = { key: TxnType.callback, value: 'Callback' };
export const AUTODIALER: KeyValue<TxnType, string> = { key: TxnType.autodialer, value: 'Autodialer' };
export const OVERFLOW: KeyValue<TxnType, string> = { key: TxnType.overflow, value: 'Overflow' };

export enum WeekDay {
  MONDAY = 'Monday',
  TUESDAY = 'Tuesday',
  WEDNESDAY = 'Wednesday',
  THURSDAY = 'Thursday',
  FRIDAY = 'Friday',
  SATURDAY = 'Satuday',
  SUNDAY = 'Sunday'
}

export const PER_PAGE = 20;
