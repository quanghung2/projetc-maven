import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'tileCase'
})
export class TileCasePipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!value) {
      return '';
    } else {
      return value.replace(/\w\S*/g, (txt => txt.toLowerCase() === 'sms' ? txt.toUpperCase()
        : txt[0].toUpperCase() + txt.substr(1).toLowerCase()));
    }
  }

}
