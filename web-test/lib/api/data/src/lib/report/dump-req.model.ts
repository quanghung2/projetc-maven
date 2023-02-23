export enum FieldFormat {
  '3dp' = '3dp',
  duration = 'duration',
  percent = 'percent',
  hide = 'hide',
  fill = 'fill',
  fill15m = 'fill15m'
}

export class ColumnDef {
  name: string;
  field: string;
  type: string;
  format: string;
  ifnull: any;
  formula: string;

  constructor(name: string, field: string, type?: string, format?: string, ifnull?: any, formula?: string) {
    this.name = name;
    this.field = field;
    this.type = type ? type : 'normal';
    this.format = format ? format : 'default';
    this.ifnull = ifnull !== undefined && ifnull !== null ? ifnull : '';
    this.formula = formula ? formula : '';
  }

  withFormat(format: FieldFormat): ColumnDef {
    this.format = format;
    return this;
  }

  ifValueForNull(nullValue: any) {
    this.ifnull = nullValue;
    return this;
  }
}

export class DumpReq {
  filename: string;
  startTime: string;
  endTime: string;
  zoneOffset: string;
  dateTimeFormat: string;
  params: any;
  columnDefs: ColumnDef[];

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
