import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { ID } from '@datorama/akita';
import { map, tap } from 'rxjs/operators';
import { Contact } from './../contact/contact.model';
import { ContactGroup, RequestCreateGroup, RequestUploadContact } from './contact-group.model';
import { ContactGroupQuery } from './contact-group.query';
import { ContactGroupStore } from './contact-group.store';

@Injectable({ providedIn: 'root' })
export class ContactGroupService {
  constructor(private store: ContactGroupStore, private http: HttpClient, private query: ContactGroupQuery) {}

  getGroups(keyword: string, page: Pageable) {
    let params = new HttpParams()
      .append('page', page?.page?.toString() || '1')
      .append('perPage', page?.perPage.toString() || '10');

    if (!!keyword) {
      params = params.append('keyword', keyword);
    }

    return this.http
      .get<ContactGroup[]>(`callcenter/private/v1/contacts/groups`, { params: params })
      .pipe(
        map(resp => resp?.map(x => new ContactGroup(x)) || []),
        tap(contacts => {
          this.store.upsertMany(contacts);
        })
      );
  }

  getAllContactsInGroup(uuid: string) {
    return this.http
      .get<Contact[]>(`callcenter/private/v1/contacts/groups/${uuid}`)
      .pipe(map(resp => resp?.map(x => new Contact(x)) || []));
  }

  uploadContact(req: RequestUploadContact) {
    return this.http.post(`callcenter/private/v1/contacts/upload`, req).pipe();
  }

  create(req: RequestCreateGroup) {
    return this.http.post(`callcenter/private/v1/contacts/groups`, req);
  }

  update(uuid: string, req: RequestCreateGroup) {
    return this.http.put<ContactGroup>(`callcenter/private/v1/contacts/groups/${uuid}`, req).pipe(
      map(group => new ContactGroup(group)),
      tap(group => {
        this.store.upsert(uuid, group, { baseClass: ContactGroup });
      })
    );
  }

  delete(uuid: string) {
    return this.http.delete(`callcenter/private/v1/contacts/groups/${uuid}`).pipe(
      tap(() => {
        this.store.remove(uuid);
      })
    );
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
}
