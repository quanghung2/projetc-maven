import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'uuid'
})
export class UuidPipe implements PipeTransform {
  transform(value: any, args?: any): any {
    if (value) {
      return value.split('-')[0] + '*';
    } else {
      return '';
    }
  }
}
