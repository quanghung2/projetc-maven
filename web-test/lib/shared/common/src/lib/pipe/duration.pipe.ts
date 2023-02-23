import { Pipe, PipeTransform } from '@angular/core';
import { addSeconds, differenceInDays, intervalToDuration } from 'date-fns';

@Pipe({
  name: 'duration'
})
export class DurationPipe implements PipeTransform {
  transform(duration: number, unit: string = 'second') {
    if (!duration) {
      duration = 0;
    }

    let durationInSec;

    if (unit === 'millisecond') {
      durationInSec = Math.round(duration / 1000);
    } else {
      durationInSec = Math.round(duration);
    }

    const dateDuration = intervalToDuration({
      start: new Date(),
      end: addSeconds(new Date(), durationInSec)
    });
    if (Number(dateDuration.months) > 0) {
      let days = differenceInDays(addSeconds(new Date(), durationInSec), new Date());
      let hours = dateDuration.minutes > 29 ? dateDuration.hours + 1 : dateDuration.hours;

      if (hours === 24) {
        hours = 0;
        days++;
      }
      return days + 'd' + hours + 'h';
    } else if (durationInSec >= 24 * 60 * 60) {
      return dateDuration.days + 'd' + dateDuration.hours + 'h' + dateDuration.minutes + 'm';
    } else if (durationInSec >= 60 * 60) {
      return dateDuration.hours + 'h' + dateDuration.minutes + 'm';
    } else if (durationInSec >= 60) {
      return dateDuration.minutes + 'm' + dateDuration.seconds + 's';
    }
    return `${durationInSec}s`;
  }
}
