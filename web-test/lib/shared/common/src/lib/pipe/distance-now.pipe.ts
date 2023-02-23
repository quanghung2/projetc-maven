import { Pipe, PipeTransform } from '@angular/core';
import { formatDistanceToNow } from 'date-fns';

@Pipe({
  name: 'distanceToNow',
  pure: false
})
export class DistanceToNowPipe implements PipeTransform {
  transform(date: number): any {
    if (date) {
      let timeString = formatDistanceToNow(new Date(date), {
        addSuffix: true
      });
      timeString = timeString.replace('about ', '');
      timeString = timeString.replace('less ', '');
      timeString = timeString.replace('in ', '');
      timeString = timeString.replace('than ', '');
      timeString = timeString.replace('a minute ago', 'Just now');
      timeString = timeString.replace('a minute', 'Just now');
      return timeString;
    }
    return '';
  }
}
