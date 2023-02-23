import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ID } from '@datorama/akita';
import { finalize, map, tap } from 'rxjs/operators';
import { Bundle, BundleStatus, GetBundleReq } from './bundle.model';
import { BundleStore } from './bundle.store';

@Injectable({ providedIn: 'root' })
export class BundleService {
  constructor(private bundleStore: BundleStore, private http: HttpClient) {}

  get(req?: GetBundleReq) {
    this.bundleStore.setLoading(true);

    let params = new HttpParams();
    if (req) {
      params = req.statuses && req.statuses.length && params.set('statuses', req.statuses.join(','));
    }
    return this.http
      .get<Bundle[]>(`license/private/v1/bundles`, { params: params })
      .pipe(
        map(list => list.map(l => new Bundle(l))),
        tap(entities => {
          this.bundleStore.set(entities);
        }),
        finalize(() => this.bundleStore.setLoading(false))
      );
  }

  getPublic(domain: string, statuses?: BundleStatus[]) {
    this.bundleStore.setLoading(true);

    let params = new HttpParams().set(`domain`, domain);
    if (statuses && statuses.length) {
      params = params.set('statuses', statuses.join(','));
    }
    return this.http
      .get<Bundle[]>(`license/public/v1/bundles`, { params: params })
      .pipe(
        map(list => list.map(l => new Bundle(l))),
        tap(entities => {
          this.bundleStore.set(entities);
        }),
        finalize(() => this.bundleStore.setLoading(false))
      );
  }

  getOne(id: ID) {
    return this.http.get<Bundle>(`license/private/v1/bundles/${id}`).pipe(
      map(e => new Bundle(e)),
      tap(entity => {
        this.bundleStore.upsert(id, entity);
      })
    );
  }

  create(bundle: Bundle) {
    return this.http.post<Bundle>(`license/private/v1/bundles`, bundle).pipe(
      map(e => new Bundle(e)),
      tap(entity => {
        entity.updatedAt = entity.updatedAt || new Date().getTime();
        this.bundleStore.add(entity);
      })
    );
  }

  update(id: ID, bundle: Partial<Bundle>) {
    return this.http.put<Bundle>(`license/private/v1/bundles/${id}`, bundle).pipe(
      map(e => new Bundle(e)),
      tap(entity => {
        entity.updatedAt = entity.updatedAt || new Date().getTime();
        this.bundleStore.update(id, entity);
      })
    );
  }

  remove(id: ID) {
    return this.http.delete<void>(`license/private/v1/bundles/${id}`).pipe(
      tap(_ => {
        this.bundleStore.remove(id);
      })
    );
  }
}
