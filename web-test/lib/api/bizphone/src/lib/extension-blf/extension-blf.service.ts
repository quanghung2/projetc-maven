import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Extension } from '../extension/model/extension.model';
import { GetExtensionReq } from '../extension/model/get-extension-req';
import { ExtensionBLF } from './extension-blf.model';
import { ExtensionBLFStore } from './extension-blf.store';

@Injectable({ providedIn: 'root' })
export class ExtensionBLFService {
  constructor(private http: HttpClient, private store: ExtensionBLFStore) {}

  getExtBLF(): Observable<ExtensionBLF[]> {
    return this.http.get<ExtensionBLF[]>(`/extension/private/blf`).pipe(
      map(res => res.map(extg => new ExtensionBLF(extg))),
      tap(res => this.store.set(res))
    );
  }

  getAvailableExts(query?: GetExtensionReq, pageable?: Pageable): Observable<Extension[]> {
    let params = new HttpParams();
    if (query) {
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null) {
          params = params.set(key, query[key]);
        }
      });

      if (query.excludeExtKeys) {
        params = params.set('excludeExtKeys', query.excludeExtKeys.join(','));
      }
    }

    if (pageable) {
      Object.keys(pageable).forEach(key => {
        if (pageable[key] !== undefined && pageable[key] !== null) {
          params = params.set(key, pageable[key]);
        }
      });
    }
    return this.http
      .get<Extension[]>(`extension/private/blf/availableExts`, {
        params: params
      })
      .pipe(map(res => res.map(ext => new Extension(ext))));
  }

  setActive(extKey: string) {
    this.store.setActive(extKey);
  }

  createExtBLF(monitorExtKey: string, req: { extKeyMonitees: string[] }): Observable<void> {
    return this.http.post<void>(`/extension/private/blf/${monitorExtKey}`, req).pipe(
      tap(_ => {
        this.store.add(
          new ExtensionBLF({
            monitor: monitorExtKey,
            monitorExtKey: monitorExtKey,
            moniteesExtKeys: req.extKeyMonitees,
            monitees: req.extKeyMonitees
          })
        );
      })
    );
  }

  updateExtBLF(monitorExtKey: string, req: { extKeyMonitees: string[] }): Observable<void> {
    return this.http.put<void>(`/extension/private/blf/${monitorExtKey}`, req).pipe(
      tap(_ => {
        this.store.updateActive({ moniteesExtKeys: req.extKeyMonitees, monitees: req.extKeyMonitees });
      })
    );
  }

  deleteExtBLF(monitorExtKey: string): Observable<void> {
    return this.http.delete<void>(`/extension/private/blf/${monitorExtKey}`).pipe(
      tap(_ => {
        this.store.remove(monitorExtKey);
      })
    );
  }
}
