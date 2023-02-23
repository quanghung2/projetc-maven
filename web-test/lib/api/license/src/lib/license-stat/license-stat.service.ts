import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { LicenseStatistic } from './license-stat.model';
import { LicenseStatStore } from './license-stat.store';

@Injectable({
  providedIn: 'root'
})
export class LicenseStatService {
  constructor(private http: HttpClient, private store: LicenseStatStore) {}

  getLicenseStatistics(addon?: { useCache: boolean }): Observable<LicenseStatistic[]> {
    const req$ = this.http.get<LicenseStatistic[]>(`license/private/v3/licenses/statistics`).pipe(
      map(list => list.map(l => new LicenseStatistic(l))),
      tap(result => this.store.set(result))
    );

    if (addon && addon.useCache && this.store.getValue().ids.length) {
      return EMPTY;
    }
    return req$;
  }

  setActive(uuid: string) {
    if (!!uuid) {
      this.store.setActive(uuid);
    }
  }
}
