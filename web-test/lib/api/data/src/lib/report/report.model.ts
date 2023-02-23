export enum Period {
  dump = 'dump',
  curr = 'curr',
  '1m' = '1m',
  '15m' = '15m',
  '30m' = '30m',
  '1h' = '1h',
  '1d' = '1d',
  '1M' = '1M',
  '*' = '*'
}

export enum Aggregate {
  full = 'full',
  interval = 'interval'
}

export class Report {
  aggredate: Aggregate;
  code: string;
  displayName: string;
  period: Period;
  supportsV4: boolean;
  isReportV4: boolean;
  type: string;
  label: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
    if (obj.label) {
      this.displayName = obj.label;
      delete this.label;
    }
  }
}

export class ReportReq {
  code: Report;
  startTime: string;
  endTime: string;
  type: Period;
}
