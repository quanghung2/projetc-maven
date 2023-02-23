import { Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';

@Pipe({
  name: 'isToday'
})
export class TodayPipe implements PipeTransform {
  transform(timestamp: number, parseFormat = 'EEEE, MMMM do'): string | boolean {
    const current = new Date(timestamp);

    if (new Date(timestamp).getDay() === new Date().getDay()) {
      return 'Today';
    }

    return format(new Date(current), parseFormat);
  }
}
