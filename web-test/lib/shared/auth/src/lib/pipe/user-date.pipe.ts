import { DatePipe } from '@angular/common';
import { Injectable, Pipe, PipeTransform } from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';

/**
 * Date pipe with default format is org time format and default timezone is org timezone
 * It's can be used as date pipe with custom format and timezone
 *
 * Need to register by IdentityProfileService.getProfile() on app component first
 */
@Pipe({
  name: 'userDate'
})
@Injectable({
  providedIn: 'root'
})
export class UserDatePipe extends DatePipe implements PipeTransform {
  defaultFormat: string;

  constructor(private orgQuery: IdentityProfileQuery) {
    super('en-US', orgQuery.currentOrg?.utcOffset);
  }

  override transform(value: any, format?: string, timezone?: string, locate?: any): any {
    const org = this.orgQuery.currentOrg;
    if (org) {
      this.defaultFormat = org.timeFormat;
    }

    return super.transform(value, format || this.defaultFormat, timezone || org.utcOffset, locate);
  }
}

// @Injectable({providedIn: 'root'})
// export class UserDateService  {
//   defaultFormat: string;
//   defaultTimezone: string;

//   constructor(private sessionQuery: SessionQuery) {
//   }

//   transform(value: any, format?: string) {
//     const org = this.sessionQuery.getOrganization();
//     if (org) {
//       this.defaultFormat = org.timeFormat;
//       this.defaultTimezone = org.utcOffset;
//     }

//     return super.transform(value, format || this.defaultFormat, timezone || this.defaultTimezone, locate);
//   }
// }
