import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { PaginationResponse } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ComplianceAction, DeviceType, ExtensionRole, ExtType } from '../enums';
import { ExtensionStore } from './extension.store';
import { Extension } from './model/extension.model';
import { GetExtensionReq } from './model/get-extension-req';

export interface AssignStaffReq {
  identityUuid: string;
  type: ExtType;
  role?: ExtensionRole;
}

@Injectable({ providedIn: 'root' })
export class ExtensionService {
  constructor(private store: ExtensionStore, private http: HttpClient) {}

  /**
   * @param query
   * @param pageable page start from 0
   */
  getExtensions(query?: GetExtensionReq, pageable?: Pageable) {
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
      .get<Extension[]>('callcenter/private/v3/extension', {
        params: params
      })
      .pipe(
        map(entities => entities.map(entity => new Extension(entity))),
        tap(entities => {
          this.store.set(entities);
        })
      );
  }

  getPage(query?: GetExtensionReq, pageable?: Pageable): Observable<PaginationResponse<Extension>> {
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
      .get<Extension[]>('callcenter/private/v3/extension', {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return <PaginationResponse<Extension>>{
            currentPage: pageable.page,
            perPage: pageable.perPage,
            lastPage: Math.ceil(totalCount / pageable.perPage),
            data: resp.body.map(sub => new Extension(sub)),
            total: totalCount
          };
        }),

        tap(page => {
          // this.store.set(page.data);
        })
      );
  }

  getOne(extKey: string) {
    return this.http.get<Extension>(`callcenter/private/v3/extension/${extKey}`).pipe(
      map(extension => new Extension(extension)),
      tap(extension => {
        if (this.store.getValue().ids && this.store.getValue().ids.indexOf(extKey) > -1) {
          this.store.update(extKey, extension);
        } else if (this.store.getValue().ids.length) {
          this.store.add(extension);
        } else {
          this.store.set([extension]);
        }
      })
    );
  }

  getAssignedExtension(identityUuid: string): Observable<Extension> {
    return this.http.get<Extension>(`/callcenter/private/v3/extension/identityUuid/${identityUuid}`);
  }

  getAssignedExtensions(uuids: string[], pageable?: Pageable): Observable<Extension[]> {
    let params = new HttpParams();
    if (pageable) {
      Object.keys(pageable).forEach(key => {
        if (pageable[key] !== undefined && pageable[key] !== null) {
          params = params.set(key, pageable[key]);
        }
      });
    }
    params = params.set('identityUuids', uuids.join(','));
    return this.http.get<Extension[]>(`/callcenter/private/v3/extension`, { params: params });
  }

  update(extKey: string, extension: Partial<Extension>): Observable<void> {
    return this.http.put<void>(`callcenter/private/v3/extension/${extKey}`, extension).pipe(
      tap(_ => {
        this.store.update(extKey, extension);
      })
    );
  }

  /// OLD API and should move out this service
  requestCallerId(extKey: string, callerId: string) {
    return this.http.post(`extension/private/callerId/${callerId}/request`, { extKey: extKey });
  }

  updateDeviceSip(extKey: string, device: DeviceType, params: any) {
    return this.http.put(`extension/private/extension/${extKey}/device/${device}/sip`, params);
  }

  updateDnc(extKey: string, dncAction: ComplianceAction, consentAction: ComplianceAction) {
    return this.http
      .put<{ ext: Extension }>(`extension/private/dnc/${extKey}`, { dnc: dncAction, consent: consentAction })
      .pipe(
        tap((res: any) => {
          this.store.update(extKey, res.ext);
        })
      );
  }

  updateDNCForExtensions(req: { selected: string[]; dnc: ComplianceAction; consent: ComplianceAction }) {
    return this.http.put<{ ext: Extension[] }>(`extension/private/dnc`, req).pipe(
      tap(res => {
        this.store.upsertMany(res.ext);
      })
    );
  }
}
