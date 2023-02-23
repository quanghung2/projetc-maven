import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { tap } from 'rxjs/operators';
import { Pinnedapp } from './pinnedapp.model';
import { PinnedappStore } from './pinnedapp.store';

@Injectable({ providedIn: 'root' })
export class PinnedappService {
  constructor(private pinnedappStore: PinnedappStore, private http: HttpClient) {}

  get() {
    const headers = new HttpHeaders().set(X_B3_HEADER.orgUuid, '');
    return this.http
      .get<Pinnedapp[]>(`portal/private/v1/settings/pinnedapps`, { headers: headers })
      .pipe(
        tap(entities => {
          this.pinnedappStore.set(entities);
        })
      );
  }

  update(pinnedapp: Array<Pinnedapp>) {
    return this.http.put<Pinnedapp[]>(`portal/private/v1/settings/pinnedapps`, pinnedapp).pipe(
      tap(entities => {
        this.pinnedappStore.set(entities);
      })
    );
  }
}
