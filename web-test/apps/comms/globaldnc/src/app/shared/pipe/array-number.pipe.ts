import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'arrayNumber'
})
export class ArrayNumberPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    let data = '';
    let lastest: number;
    let start = true;
    let range = false;
    value.forEach(n => {
      if (start) {
        data += n;
        start = false;
      } else if (lastest == n - 1) {
        if (!range) {
          data += '-';
          range = true;
        }
      } else {
        if (range) {
          data += lastest + ',' + n;
          range = false;
        } else {
          data += ',' + n;
        }
      }
      lastest = n;
    });
    if (range) {
      data += lastest;
    }
    return data;
  }
}
