import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dncStatus'
})
export class DNCStatusPipe implements PipeTransform {
  friendlyName = {
    dnc: 'DNC',
    notRecorded: 'NR',
    failed: 'FAILED',
    skipped: 'SKIPPED'
  };

  description = {
    dnc: 'Do-not-call/text/fax as registered in DNC Registry',
    notRecorded: 'Not registered on DNC Registry and Company List',
    failed: 'Failed',
    invalidFormat: 'Not a valid Singapore number',
    skipped: 'Skipped'
  };

  transform(value: any, args?: any): any {
    if (args && args.length > 0) {
      let description = this.description[value];
      if (description) {
        return description;
      } else {
        return value;
      }
    } else {
      let friendlyName = this.friendlyName[value];
      if (friendlyName) {
        return friendlyName;
      } else {
        return value;
      }
    }
  }
}
