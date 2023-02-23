import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Accessible } from './accessible.model';
import { AccessibleStore } from './accessible.store';

@Injectable({
  providedIn: 'root'
})
export class AccessibleService {
  constructor(private http: HttpClient, private store: AccessibleStore) {}

  getAccessibles(accessor) {
    let params = new HttpParams();
    params = params.set('accessor', accessor);

    return this.http
      .get<Accessible[]>(`/data/private/v4/format`, { params: params })
      .pipe(
        map(res => {
          return res.map(res => new Accessible(res));
        }),
        tap(res => {
          this.store.set(res);
        })
      );
  }

  updateAccessible(accessible: Accessible) {
    return this.http.post<Accessible>(`/data/private/v4/format`, accessible).pipe(
      map(res => new Accessible(res)),
      tap(_ => this.store.add(accessible))
    );
  }

  deleteAccess(access: Accessible) {
    let body = {
      code: access.code,
      type: access.type,
      accessor: access.accessor
    };
    return this.http
      .request<void>('delete', `/data/private/v4/format`, { body: body })
      .pipe(
        tap(_ => {
          this.store.remove(access.id);
        })
      );
  }
}
