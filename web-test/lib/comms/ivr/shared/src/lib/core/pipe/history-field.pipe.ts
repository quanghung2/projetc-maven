import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'historyField'
})
export class HistoryFieldPipe implements PipeTransform {
  transform(item: string, map: any, fieldName: string): string {
    const result = map[item];
    if (result) {
      if (fieldName) {
        return result[fieldName];
      }

      return result;
    }

    return 'n/a';
  }
}
