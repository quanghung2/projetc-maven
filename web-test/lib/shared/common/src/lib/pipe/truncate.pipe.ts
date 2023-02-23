import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate'
})
export class TruncatePipe implements PipeTransform {
  transform(text: string, args: number): any {
    if (text) {
      let val = text.replace('\n', ' ');
      if (val.length > args) {
        val = val.slice(0, args) + ' ...';
      }
      return val;
    }
    return '';
  }
}
