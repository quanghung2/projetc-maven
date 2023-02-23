import { format, parse } from 'date-fns';

export class Holiday {
  readonly apiFormmat = 'dd-MM-yyyy';
  readonly YYYY_MM_DD = 'yyyy-MM-dd';

  id: number;
  countryCode: string;
  date: string;
  description: string;
  year: number;
  status: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
    this.date = format(parse(obj.date, this.apiFormmat, new Date()), this.YYYY_MM_DD);
  }
}
