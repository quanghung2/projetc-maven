import { ConvoType, ResponseLevel } from '../enums.model';

export class CannedResponse {
  id: number;
  name: string;
  subject: string;
  content: string;
  level: ResponseLevel;
  status: CannedResponseStatus;
  inbox: string;
  type: ConvoType;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class CannedResponseRequest {
  name: string;
  content: string;
}

export enum CannedResponseStatus {
  active = 'active',
  disabled = 'disable',
  archived = 'archived'
}
