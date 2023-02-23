import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_PAGINATION } from '@b3networks/shared/common';
import { ID } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { DirectoryMember, GetDirectoryMembersReq } from './member';
import { DirectoryMemberStore } from './member.store';

@Injectable({
  providedIn: 'root'
})
export class DirectoryMemberService {
  constructor(private http: HttpClient, private store: DirectoryMemberStore) {}

  getMembers(req: GetDirectoryMembersReq, pageable?: Pageable): Observable<Page<DirectoryMember>> {
    let params = new HttpParams();
    Object.keys(req)
      .filter(key => req[key] != null)
      .forEach(key => {
        if (key === 'status') {
          params = req.status != null && req.status.length ? params.set('status', req.status.join(',')) : params;
        } else if (key in req && req[key] != null) {
          params = params.set(key, req[key]);
        }
      });

    if (pageable) {
      params = params.set('page', String(pageable.page)).set('size', String(pageable.perPage));
    }

    return this.http
      .get<DirectoryMember[]>(`directory/private/v1/members`, { params: params, observe: 'response' })
      .pipe(
        map(resp => {
          const page = new Page<DirectoryMember>();
          page.content = resp.body.map(mem => new DirectoryMember(mem));
          page.totalCount = +resp.headers.get(X_PAGINATION.totalCount);
          return page;
        }),
        tap(page => {
          this.store.set(page.content);
        })
      );
  }

  setActive(id: ID) {
    this.store.setActive(id);
  }

  removeActive(id: ID) {
    this.store.removeActive(id);
  }
}
