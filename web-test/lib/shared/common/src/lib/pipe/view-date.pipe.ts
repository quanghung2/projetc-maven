import { Pipe, PipeTransform } from '@angular/core';
import { format } from 'date-fns';

@Pipe({
  name: 'viewDate'
})
export class ViewDatePipe implements PipeTransform {
  transform(timestamp: number): string | boolean {
    const current = new Date(timestamp || new Date().valueOf()).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);

    if (current === today) {
      return 'Today';
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (current === yesterday.setHours(0, 0, 0, 0)) {
      return 'Yesterday';
    }

    const yearCurrent = format(current, 'yyyy');
    const year = new Date().getFullYear().toString();
    if (yearCurrent !== year) {
      return format(current, 'EEEE, MMMM do yyyy');
    }

    return format(current, 'EEEE, MMMM do');
  }
}
