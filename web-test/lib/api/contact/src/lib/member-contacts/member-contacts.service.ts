import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { BlackList, ListType } from './member-contacts.model';
import { MemberContactsStore } from './member-contacts.store';

@Injectable({ providedIn: 'root' })
export class MemberContactsService {
  constructor(private store: MemberContactsStore, private http: HttpClient) {}

  addNumber(type: ListType, number: string) {
    return this.http.put(`callcenter/private/v1/member/contacts/_${type}`, <BlackList>{
      number: number
    });
  }

  get(type: ListType) {
    return this.http.get<BlackList[]>(`callcenter/private/v1/member/contacts/_${type}`).pipe(
      tap(list => {
        this.store.update(type === ListType.blacklist ? { blacklist: list } : { whitelist: list });
      })
    );
  }

  delete(type: ListType, number: string) {
    const params = new HttpParams().append('number', number);
    return this.http.delete(`callcenter/private/v1/member/contacts/_${type}`, { params: params });
  }

  // admin set
  addNumberForMember(memberID: string, type: ListType, number: string) {
    return this.http.put(`callcenter/private/v1/member/${memberID}/contacts/_${type}`, <BlackList>{
      number: number
    });
  }

  getForMember(memberID: string, type: ListType) {
    return this.http.get<BlackList[]>(`callcenter/private/v1/member/${memberID}/contacts/_${type}`).pipe(
      tap(list => {
        this.store.update(type === ListType.blacklist ? { blacklist: list } : { whitelist: list });
      })
    );
  }

  deleteForMember(memberID: string, type: ListType, number: string) {
    const params = new HttpParams().append('number', number);
    return this.http.delete(`callcenter/private/v1/member/${memberID}/contacts/_${type}`, { params: params });
  }
}
