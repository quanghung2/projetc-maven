import { Pipe, PipeTransform } from '@angular/core';
import { StatusConsent } from '@b3networks/api/dnc';

@Pipe({
  name: 'statusConsent'
})
export class StatusConsentPipe implements PipeTransform {
  transform(status: StatusConsent) {
    switch (status) {
      case StatusConsent.notRecorded:
        return 'Not Recorded';
      case StatusConsent.whitelist:
        return 'Whitelist';
      case StatusConsent.blacklist:
        return 'Blacklist';
      default:
        return status;
    }
  }
}
