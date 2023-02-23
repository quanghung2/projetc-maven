import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cacheable } from '@datorama/akita';
import { map, tap } from 'rxjs/operators';
import { OrgConfig } from './org-config.model';
import { OrgConfigStore } from './org-config.store';

@Injectable({
  providedIn: 'root'
})
export class OrgConfigService {
  constructor(private http: HttpClient, private store: OrgConfigStore) {}

  getConfig() {
    const req$ = this.http.get<OrgConfig>(`callcenter/private/v1/org/config`).pipe(
      map(config => new OrgConfig(config)),
      tap(config => {
        this.store.updateWithCacheable(config);
      })
    );

    return cacheable(this.store, req$);
  }

  updateConfig(config: Partial<OrgConfig>) {
    return this.http.put<OrgConfig>(`callcenter/private/v1/org/config`, config).pipe(
      map(item => new OrgConfig(item)),
      tap(item => this.store.update(item))
    );
  }
}
