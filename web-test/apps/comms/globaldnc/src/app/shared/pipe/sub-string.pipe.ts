import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'subString'
})
export class SubStringPipe implements PipeTransform {
  transform(value: any, arg1: any, arg2: any): any {
    if (value && value.length > arg1) {
      return value.slice(0, arg1) + arg2;
    }
    return value;
  }
}
