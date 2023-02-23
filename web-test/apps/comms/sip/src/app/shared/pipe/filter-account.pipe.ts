import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterAccount'
})
export class FilterAccountPipe implements PipeTransform {
  transform(items: any[], arg?: any): any {
    return items.filter(item => {
      if (arg === undefined || arg === '') {
        return true;
      }

      return item.sipUsername.indexOf(arg) >= 0;
    });
  }
}
