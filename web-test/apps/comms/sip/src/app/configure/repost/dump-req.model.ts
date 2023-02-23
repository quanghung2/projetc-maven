import { CallType } from './history-info';

export class ColumnDef {
  name: string;
  field: string;
  type: string;
  format: string;
  ifnull: any;

  constructor(name: string, field: string, type?: string, format?: string, ifnull?: string) {
    this.name = name;
    this.field = field;
    this.type = type ? type : 'normal';
    this.format = format ? format : 'default';
    this.ifnull = ifnull ? ifnull : '';
  }

  ifValueForNull(nullValue: any) {
    this.ifnull = nullValue;
    return this;
  }
}

export class DumpRequest {
  columnDefs: ColumnDef[];
  endTime: string;
  startTime: string;
  dateTimeFormat: string;
  filename: string;
  params: {
    callType: CallType;
    dest: string;
  };
  zoneOffset: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
