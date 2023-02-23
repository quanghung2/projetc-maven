import { Pipe, PipeTransform } from '@angular/core';
import { CauseNumber } from '@b3networks/api/dnc';

@Pipe({
  name: 'dncStatus'
})
export class DNCStatusPipe implements PipeTransform {
  transform(cause: CauseNumber): any {
    switch (cause) {
      case CauseNumber.dnc:
        return 'DNC';
      default:
        return cause;
    }
  }
}
