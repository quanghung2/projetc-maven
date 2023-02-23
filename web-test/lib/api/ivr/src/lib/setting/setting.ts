import { NotifyBlock } from '@b3networks/api/ivr';

export class Setting {
  public type: string;
  public flowUuid: string;
  public orgUuid: string;
  public status: string;

  constructor(params?: any) {
    if (params) {
      this.type = params.type;
      this.flowUuid = params.flowUuid;
      this.orgUuid = params.orgUuid;
      this.status = params.status;
    }
  }
}

export enum SettingType {
  notification
}

export enum SettingStatus {
  active,
  inactive
}

export class NotificationSettingsResponse {
  orgUuid: string;
  status: string;
  type: string;
  workFlowUuid: string;
  data: NotifyBlock;

  constructor(params?) {
    Object.assign(this, params);
  }
}

export class PlaceholderSettingsResponse {
  orgUuid: string;
  status: string;
  type: string;
  workFlowUuid: string;
  data: PlaceholderData;

  constructor(params?) {
    Object.assign(this, params);
  }
}

export class PlaceholderData {
  type: string;
  placeHolderMap: any;
}

export class SensitiveSettings {
  type: string;
  workflowUuid: string;
  orgUuid: string;
  data: SensitiveData;
  status: string;

  constructor(obj?) {
    Object.assign(this, obj);
  }
}

export interface SensitiveData {
  type: string;
  storePressedDigits: boolean;
}
