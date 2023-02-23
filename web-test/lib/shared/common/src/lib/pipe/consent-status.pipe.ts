import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'consentStatus'
})
export class ConsentStatusPipe implements PipeTransform {
  friendlyName = {
    blacklist: 'BL',
    whitelist: 'WL',
    notRecorded: 'NR',
    failed: 'FAILED',
    skipped: 'SKIPPED'
  };

  shortDescription = {
    blacklist: 'Blacklist',
    whitelist: 'Whitelist',
    notRecorded: 'Not recorded',
    failed: 'Failed',
    skipped: 'Skipped'
  };

  description = {
    blacklist: 'Blacklist (Company Opt-out List)',
    whitelist: 'Whitelist',
    notRecorded: 'Not registered on DNC Registry and Company List',
    failed: 'Failed',
    skipped: 'Not a valid Singapore number'
  };

  transform(value: any, arg?: any): any {
    if (arg) {
      let description = this.description[value];
      if (arg == 'short') {
        description = this.shortDescription[value];
      }
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
