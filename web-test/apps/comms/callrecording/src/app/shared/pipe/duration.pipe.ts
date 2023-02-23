import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'durationMinutes'
})
export class DurationPipe implements PipeTransform {
  transform(value: number): any {
    let duration: number = Math.ceil(moment.duration(value).asMinutes());
    return duration > 1 ? `${duration} minutes` : `${duration} minute`;
  }
}
