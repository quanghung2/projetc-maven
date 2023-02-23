import { TimeRangeKey } from '@b3networks/shared/common';

export enum ModuleDescription {
  callcenter = 'callcenter',
  extension = 'extension',
  msInvoice = 'ms-invoice',
  workflow = 'workflow',
  appVirtualline = 'app-virtualline',
  wallboard = 'wallboard',
  directline = 'directline',
  appsip = 'appsip',
  fax = 'fax',
  flow = 'flow',
  ms_data = 'ms-data'
}

export class EventNameDescription {
  name: string;
  description: string;
  constructor(obj?: Partial<EventNameDescription>) {
    if (obj) {
      Object.assign(this, obj);
      this.description = this.description || this.name;
    }
  }
}

export class AuditEventName {
  moduleName: ModuleDescription;
  moduleDescription: string;
  eventName: EventNameDescription[];

  constructor(obj?: Partial<AuditEventName>) {
    if (obj) {
      Object.assign(this, obj);
      this.moduleDescription = this.moduleDescription || this.moduleName;
      this.eventName = obj.eventName?.map(x => new EventNameDescription(x)) || [];
    }
  }
}

export interface AuditSearchLogRequest {
  fromTime: number;
  toTime: number;
  moduleName: string;
  auditName: string;
  user: string;
  query: string;
  page: number;
  size: number;
}

export interface AuditFilter {
  lastTimeFilter?: TimeRangeKey;
  moduleFilter?: ModuleDescription | any;
  actionFilter?: string;
  userFilter?: string;
  startDate?: Date;
  endDate?: Date;
  queryFilter?: string;
}
