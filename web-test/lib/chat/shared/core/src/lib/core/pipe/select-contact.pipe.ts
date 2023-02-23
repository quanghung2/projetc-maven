import { Pipe, PipeTransform } from '@angular/core';
import { Contact, ContactQuery } from '@b3networks/api/contact';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'selectContact'
})
export class SelectContactPipe implements PipeTransform {
  constructor(private contactQuery: ContactQuery) {}

  transform(contactUuid: string): Observable<Contact> {
    return this.contactQuery.selectEntity(contactUuid).pipe(
      map(
        x =>
          x ||
          <Contact>{
            uuid: contactUuid,
            displayName: 'Unknown Contact'
          }
      )
    );
  }
}
