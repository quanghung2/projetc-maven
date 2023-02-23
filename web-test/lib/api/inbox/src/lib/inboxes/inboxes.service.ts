import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Contact } from '@b3networks/api/contact';
import { map, tap } from 'rxjs/operators';
import { Inbox, StoreInboxRequest } from './inboxes.model';
import { InboxesStore } from './inboxes.store';

@Injectable({
  providedIn: 'root'
})
export class InboxesService {
  constructor(private http: HttpClient, private store: InboxesStore) {}

  getAll() {
    return this.http.get<Inbox[]>('inbox/private/v2/inboxes').pipe(
      map(responses => responses.map(response => new Inbox(response))),
      tap(responses => {
        this.store.set(responses);
      })
    );
  }

  getDetail(inboxUuid: string) {
    return this.http.get<Inbox>(`inbox/private/v2/inboxes/${inboxUuid}`).pipe(
      map(data => new Inbox(data)),
      tap(data => {
        this.store.upsertMany([data]);
      })
    );
  }

  createInbox(req: StoreInboxRequest) {
    return this.http.post<Inbox>('inbox/private/v2/inboxes', req).pipe(
      map(data => new Inbox(data)),
      tap(res => {
        this.store.upsertMany([res]);
      })
    );
  }

  updateInbox(inboxUuid: string, req: StoreInboxRequest) {
    return this.http.put<Inbox>(`inbox/private/v2/inboxes/${inboxUuid}`, req).pipe(
      map(data => new Inbox(data)),
      tap(res => {
        this.store.upsertMany([res]);
      })
    );
  }

  getSingleContact(contactUuid: string) {
    return this.http.get<Contact>(`inbox/private/v2/customers/${contactUuid}`).pipe(map(x => new Contact(x)));
  }
}
