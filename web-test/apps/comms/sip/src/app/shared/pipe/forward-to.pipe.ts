import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatForwardTo'
})
export class ForwardToPipe implements PipeTransform {
  transform(value: string, args?: any): any {
    if (!!value) {
      if (value.toUpperCase().indexOf('sip'.toUpperCase()) > -1) {
        const arr = value.split(';');
        return arr.join(', ');
      }
    }
    return value;
  }
}
