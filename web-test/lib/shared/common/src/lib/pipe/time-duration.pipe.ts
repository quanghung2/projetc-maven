import { Pipe, PipeTransform } from '@angular/core';

// 08:42:51 => 8h 42m , 00:42:51 => 42m 51s , 00:00:51 => 51s
@Pipe({
  name: 'timeDuration'
})
export class TimeDurationPipe implements PipeTransform {
  transform(duration: string) {
    if (!!duration) {
      const items = duration.split(':').map(x => +x);

      if (items[0] === 0 && items[1] === 0 && items[2] === 0) {
        return '--';
      }
      if (items[0] === 0 && items[1] === 0) {
        return items[2] + 's';
      }
      if (items[0] === 0) {
        return `${items[1]}m ${items[2]}s`;
      }
      return `${items[0]}h ${items[1]}m`;
    }
    return '--';
  }
}
