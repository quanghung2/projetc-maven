import { Pipe, PipeTransform } from '@angular/core';
import { Status } from '@b3networks/api/callcenter';

@Pipe({
  name: 'numberAction'
})
export class NumberActionPipe implements PipeTransform {
  transform(status: string): string {
    if (status === Status.draft) {
      return 'draft';
    } else if (status === Status.checking) {
      return 'check';
    } else if (status === Status.published) {
      return 'Start';
    } else if (status === Status.paused) {
      return 'pause';
    } else {
      return status;
    }
  }
}
