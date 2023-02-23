import { Pipe, PipeTransform } from '@angular/core';

import * as moment from 'moment';

@Pipe({
  name: 'dateFormatter'
})
export class DateFormatterPipe implements PipeTransform {
  transform(value: any, arg1?: any, arg2?: any): any {
    if (arg1) {
      return moment(value).format(arg1).toLowerCase() === 'Invalid date'.toLowerCase()
        ? value
        : moment(value).format(arg1);
    } else {
      return value;
    }
  }
}
