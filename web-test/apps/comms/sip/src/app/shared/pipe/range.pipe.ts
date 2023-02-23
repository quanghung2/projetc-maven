import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'range'
})
export class RangePipe implements PipeTransform {
  transform(value: any, arg1: any, arg2: any): any {
    if (value) {
      let res = [];
      if (arg1 < arg2) {
        for (let i = arg1; i <= arg2; i++) {
          res.push(i);
        }
      } else {
        for (let i = arg1; i >= arg2; i--) {
          res.push(i);
        }
      }
      return res;
    } else {
      return [];
    }
  }
}
