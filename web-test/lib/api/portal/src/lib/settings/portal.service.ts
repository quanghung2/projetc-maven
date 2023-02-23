import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { PortalData } from './portal.model';
import { PortalStore } from './portal.store';

@Injectable({
  providedIn: 'root'
})
export class PortalService {
  constructor(private http: HttpClient, private portalStore: PortalStore) {}

  /**
   * This api should call each time use switch org
   */
  getPortalData() {
    return forkJoin([
      this.http.get(`/portal/private/v1/orgHomeBackground`, { responseType: 'text' }).pipe(catchError(_ => of('')))
    ]).pipe(
      map(([background]) => <PortalData>{ orgBackground: background }),
      tap(data => {
        this.portalStore.update(data);
        this.portalStore.setHasCache(true);
      })
    );
  }

  updateOrgHomeBackground(color: string) {
    return this.http
      .post<void>(`/portal/private/v1/orgHomeBackground`, { backgroundColor: color })
      .pipe(
        tap(_ => {
          this.portalStore.update({ orgBackground: color });
        })
      );
  }
}
