import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { isLocalhost } from '@b3networks/shared/common';
import { ID } from '@datorama/akita';
import { map, tap } from 'rxjs/operators';
import { ContactUI } from './contact-ui.model';
import { Contact, ContactsFilterState, StoreContactReq, UserContactType } from './contact.model';
import { ContactQuery } from './contact.query';
import { ContactStore } from './contact.store';
// https://b3networks.atlassian.net/browse/B3-3620

@Injectable({ providedIn: 'root' })
export class ContactService {
  constructor(private store: ContactStore, private http: HttpClient, private query: ContactQuery) {}

  get(pageable?: Pageable) {
    if ((isLocalhost() ? '' : window.parent.location.hostname) === 'pbx.qontak.com') {
      const params = new HttpParams()
        .set('page', pageable ? pageable.page.toString() : '1')
        .set('perPage', pageable ? pageable.perPage.toString() : '100');

      return this.http
        .get<Contact[]>('callcenter/private/v2/contacts', { params: params })
        .pipe(
          tap(list => {
            const transfer = list.map(x => <Contact>{ ...x, isTemporary: false });
            this.store.upsertMany(transfer, { baseClass: Contact });
          })
        );
    } else {
      const params = new HttpParams()
        .set('userType', UserContactType.customer)
        .set('page', pageable ? pageable.page.toString() : '1')
        .set('perPage', pageable ? pageable.perPage.toString() : '100');

      return this.http
        .get<Contact[]>('callcenter/private/v1/member/contacts', { params: params })
        .pipe(
          tap(list => {
            const transfer = list.map(x => <Contact>{ ...x, isTemporary: false });
            this.store.upsertMany(transfer, { baseClass: Contact });
          })
        );
    }
  }

  search(keyword: string, pageable?: Pageable, isCompany?: boolean) {
    if ((isLocalhost() ? '' : window.parent.location.hostname) === 'pbx.qontak.com' || isCompany) {
      const params = new HttpParams()
        .set('keyword', keyword)
        .set('page', pageable ? pageable.page.toString() : '1')
        .set('perPage', pageable ? pageable.perPage.toString() : '5');

      return this.http
        .get<Contact[]>('callcenter/private/v2/contacts', { params: params })
        .pipe(
          map(list => list.map(item => new Contact(item))),
          tap(list => {
            const transfer = list.map(x => <Contact>{ ...x, isTemporary: false });
            this.store.upsertMany(transfer, { baseClass: Contact });
          })
        );
    } else {
      const params = new HttpParams()
        .set('keyword', keyword)
        .set('userType', UserContactType.customer)
        .set('page', pageable ? pageable.page.toString() : '1')
        .set('perPage', pageable ? pageable.perPage.toString() : '5');

      return this.http
        .get<Contact[]>('callcenter/private/v1/member/contacts', { params: params })
        .pipe(
          map(list => list.map(item => new Contact(item))),
          tap(list => {
            const transfer = list.map(x => <Contact>{ ...x, isTemporary: false });
            this.store.upsertMany(transfer, { baseClass: Contact });
          })
        );
    }
  }

  getContacts(uuids: string[]) {
    const params = new HttpParams().set('uuids', uuids.join(','));
    return this.http
      .get<Contact[]>(`callcenter/private/v1/contacts`, { params: params })
      .pipe(
        map(resp => resp.map(c => new Contact(c)) || []),
        tap(contacts => {
          const transfer = contacts.map(x => <Contact>{ ...x, isTemporary: false });
          this.store.upsertMany(transfer, { baseClass: Contact });
        })
      );
  }

  getOne(id: string) {
    return this.http.get<Contact>(`callcenter/private/v1/contacts/${id}`).pipe(
      map(resp => new Contact({ ...resp, isTemporary: false })),
      tap(contact => {
        if (this.store._value().ids.indexOf(id) > -1) {
          this.store.update(id, contact);
        } else {
          this.store.add(contact);
        }
      })
    );
  }

  createCompanyContact(req: StoreContactReq) {
    return this.http.post<Contact>(`callcenter/private/v1/contacts`, req).pipe(
      map(resp => new Contact(resp)),
      tap(contact => this.store.add(contact))
    );
  }

  create(req: StoreContactReq) {
    return this.http.post<Contact>(`callcenter/private/v1/member/contacts`, req).pipe(
      map(resp => new Contact({ ...resp, isTemporary: false })),
      tap(contact => this.store.add(contact))
    );
  }

  update(id: string, req: StoreContactReq) {
    return this.http.put<Contact>(`callcenter/private/v1/contacts/${id}`, req).pipe(
      map(resp => new Contact({ ...resp, isTemporary: false })),
      tap(contact => this.store.update(id, contact))
    );
  }

  updateV2(id: string, req: StoreContactReq) {
    return this.http.put<Contact>(`callcenter/private/v2/contacts/${id}`, req).pipe(
      map(resp => new Contact({ ...resp, isTemporary: false })),
      tap(contact => this.store.update(id, contact))
    );
  }

  updateRecentContactsActive(contactUuid: string) {
    let list = [...this.query.getValue().recentContacts] || [];
    const index = list.indexOf(contactUuid);
    if (index > -1) {
      list.splice(index, 1);
    }
    list = [contactUuid, ...list];

    this.store.update({ recentContacts: list });
  }

  updateFilter(filter: Partial<ContactsFilterState>) {
    this.store.updateUiState(filter);
  }

  setActive(id: string) {
    if (!!id) {
      this.store.setActive(id);
    }
  }

  removeActive(id: ID) {
    if (!!id) {
      this.store.removeActive(id);
    }
  }

  updateContacts2Store(contacts: Contact[]) {
    this.store.upsertMany(contacts, { baseClass: Contact });
  }

  updateUIViewState(convoId: string | string[], state: Partial<ContactUI>) {
    this.store.ui.update(convoId, state);
  }
}
