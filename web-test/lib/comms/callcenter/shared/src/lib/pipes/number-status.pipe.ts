import { Pipe, PipeTransform } from '@angular/core';
import { Status } from '@b3networks/api/callcenter';

@Pipe({
  name: 'numberStatus'
})
export class NumberStatusPipe implements PipeTransform {
  transform(status: string): string {
    if (status === Status.draft) {
      return 'Draft';
    } else if (status === Status.published) {
      return 'In Progress';
    } else if (status === Status.paused) {
      return 'Paused';
    } else if (status === Status.finished) {
      return 'Completed';
    } else {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  }
}
