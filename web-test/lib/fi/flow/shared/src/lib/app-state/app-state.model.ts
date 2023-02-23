import { RegexValidation } from '@b3networks/api/flow';

export enum AppName {
  FLOW = 'FLOW',
  PROGRAMMABLE_FLOW = 'PROGRAMMABLE_FLOW',
  BUSINESS_ACTION_CREATOR = 'BUSINESS_ACTION_CREATOR'
}

export enum BaUserGroupID {
  QUEUE_MANAGEMENT = 'queueManagement',
  INBOUND_MISSED_CALLS = 'extMissedCall'
}

export interface AppConfig {
  name: AppName;
}

export enum ValidateNumberValue {
  MIN = -1000000000000000,
  MAX = 1000000000000000
}

export enum ValidateStringMaxLength {
  NAME_TITLE = 100,
  DESCRIPTION = 255,
  USER_INPUT = 2000,
  TEMPLATE = 1000,
  CUSTOM_ACTION_BODY_TEMPLATE = 10000,
  EXTRACT_RESPONSE = 10000,
  REGEX_PATTERN = 10000
}

export interface ReqValidate {
  dataType?: string;
  required?: boolean;
  minlength?: number;
  maxlength?: number;
  min?: number;
  max?: number;
  pattern?: RegexValidation;
}
