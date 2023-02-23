import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { HashMap, PaginationResponse } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ExtensionGroup, GetExtGroupReq } from './extension-group.model';
import { ExtensionGroupStore } from './extension-group.store';

@Injectable({
  providedIn: 'root'
})
export class ExtensionGroupService {
  constructor(private http: HttpClient, private extensionGroupStore: ExtensionGroupStore) {}

  getListExtensionGroup(query?: GetExtGroupReq, pageable?: Pageable): Observable<PaginationResponse<ExtensionGroup>> {
    let params = new HttpParams();

    Object.keys(query).forEach(key => {
      if (query[key] !== undefined && query[key] !== null) {
        params = params.set(key, query[key]);
      }
    });

    if (pageable) {
      Object.keys(pageable).forEach(key => {
        if (pageable[key] !== undefined && pageable[key] !== null) {
          params = params.set(key, pageable[key]);
        }
      });
    }

    return this.http
      .get<ExtensionGroup[]>(`callcenter/private/v3/extension-group`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return <PaginationResponse<ExtensionGroup>>{
            currentPage: pageable.page,
            perPage: pageable.perPage,
            lastPage: Math.floor(totalCount / pageable.perPage),
            data: resp.body.map(extg => new ExtensionGroup(extg)),
            total: totalCount
          };
        })
      );
  }

  update(extensionGroup: ExtensionGroup) {
    return this.http
      .put(`callcenter/private/v3/extension-group/${extensionGroup.extKey}`, extensionGroup)
      .pipe(tap(extGroup => this.extensionGroupStore.update(extensionGroup.extKey, extGroup)));
  }

  setActive(extKey: string) {
    this.extensionGroupStore.setActive(extKey);
  }

  checkExtensionsExistInAnyGroup(extkeys: string[]): Observable<HashMap<boolean>> {
    const params = new HttpParams().set('extList', extkeys.join(','));
    return this.http.get<HashMap<boolean>>(`callcenter/private/v3/extension-group/check`, { params: params });
  }

  create(extensionGroup: ExtensionGroup): Observable<ExtensionGroup> {
    return this.http
      .post<ExtensionGroup>(`callcenter/private/v3/extension-group`, extensionGroup)
      .pipe(map(res => new ExtensionGroup(res)));
  }

  delete(extensionGroup: ExtensionGroup): Observable<void> {
    return this.http.delete<void>(`callcenter/private/v3/extension-group/${extensionGroup.extKey}`);
  }
}
