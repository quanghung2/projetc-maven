import { DatePipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'transferDate$'
})
export class TransferDatePipe implements PipeTransform {
  constructor(private orgQuery: IdentityProfileQuery, private datePipe: DatePipe) {}

  transform(value: string): Observable<string> {
    return this.orgQuery.currentOrg$.pipe(
      map(org => <string>this.datePipe.transform(value, org.timeFormat, org.utcOffset))
    );
  }
}
