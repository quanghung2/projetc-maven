import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  DeviceType,
  ExtDevice,
  Extension,
  ExtensionBase,
  GetAllExtsParams,
  RingConfig
} from '@b3networks/api/bizphone';
import { cacheable, ID } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AllowedCallerId, DelegatedCallerId, UpdateExtDevice } from './allowed-callerid.model';
import { ExtensionStore } from './extension.store';

@Injectable({ providedIn: 'root' })
export class ExtensionService {
  constructor(private store: ExtensionStore, private http: HttpClient) {}

  updateMoh(extKey: string, updateRingConfig: Partial<RingConfig>) {
    const body = {
      ringConfig: updateRingConfig
    };

    return this.http.put<void>(`callcenter/private/v3/extension/${extKey}`, body);
  }

  getMe() {
    return this.http.get<Extension>('callcenter/private/v3/extension/me').pipe(
      map(
        ext => new Extension(ext),
        tap((ext: Extension) => {
          this.store.update({ me: ext });
          this.store.add(ext);
        })
      )
    );
  }
  // only use display lable
  getAllExtenison(cache: boolean = true, params?: GetAllExtsParams) {
    let httpParams = new HttpParams();

    if (params) {
      if (params.filterDelegable) {
        httpParams = httpParams.set('filterDelegable', params.filterDelegable);
      }

      if (params.filterGroupable) {
        httpParams = httpParams.set('filterGroupable', params.filterGroupable);
      }
    }

    const req$ = this.http.get<ExtensionBase[]>(`callcenter/private/v3/extension/_all`, { params: httpParams }).pipe(
      map(exts => exts.map(x => new ExtensionBase(x))),
      // map(_ => []), // teting only
      tap(exts => {
        if (params?.filterDelegable === 'true' || params?.filterGroupable === 'true') {
          return;
        }
        this.store.set(exts);
      })
    );

    return cache ? cacheable(this.store, req$) : req$;
  }

  getDetails(extKey: string) {
    return this.http.get<Extension>(`callcenter/private/v3/extension/${extKey}`).pipe(
      map(extension => new Extension(extension)),
      tap(extension => {
        this.store.upsert(extKey, extension);
      })
    );
  }

  update(extKey: string, extension: Partial<Extension>, addon?: { devices: ExtDevice[] }): Observable<void> {
    return this.http.put<void>(`callcenter/private/v3/extension/${extKey}`, extension).pipe(
      tap(_ => {
        this.store.update(extKey, extension);
      })
    );
  }

  /**
   * Update ext device to change protocol & STUN config. Result of this will ignore to update entity store
   * @param id
   * @param req
   */
  updateExtDevice(id: { extKey: string; deviceType: DeviceType; sipUsername: string }, req: UpdateExtDevice) {
    return this.http
      .put<void>(`callcenter/private/v3/extension/${id.extKey}/device/${id.deviceType}/${id.sipUsername}`, req)
      .pipe(tap(_ => {}));
  }

  getAllowedCallerId(extKey: string) {
    return this.http.get<AllowedCallerId>(`callcenter/private/v3/extension/${extKey}/allowedCallerId`).pipe(
      tap(res => {
        this.store.update(state => {
          const data = { ...state.allowedCallerIds };
          data[extKey] = res;
          return { allowedCallerIds: data };
        });
      })
    );
  }

  getDelegatedCallerId(extKey: string) {
    return this.http
      .get<{
        [key: string]: string;
      }>(`callcenter/private/v3/extension/${extKey}/delegatedCallerId`)
      .pipe(
        tap(delegatedCallerId => {
          const list: DelegatedCallerId[] = [];

          Object.keys(delegatedCallerId).forEach(key => {
            list.push(<DelegatedCallerId>{
              extKey: delegatedCallerId[key],
              number: key
            });
          });

          this.store.update(state => {
            const data = { ...state.delegatedCallerIds };
            data[extKey] = list;
            return { delegatedCallerIds: data };
          });
        })
      );
  }

  setActive(extKey: ID) {
    this.store.setActive(extKey);
  }

  removeActive(extKey: ID) {
    this.store.removeActive(extKey);
  }

  syncExtensionKey(extension: Partial<Extension>, toKey: string) {
    const newOne = new Extension({ ...extension, extKey: toKey });
    this.store.add(newOne);
    this.store.remove(extension.extKey);
  }

  export() {
    return this.http.get(`callcenter/private/v1/extensions/export`, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  import(fileKey: string) {
    return this.http.post(`callcenter/private/v1/extensions/import`, {
      fileKey
    });
  }

  setDelegate(fromExtKey: string, toExtKey: string) {
    return this.http.post(`callcenter/private/v3/extension/${fromExtKey}/delegate/${toExtKey}`, {});
  }

  delDelegate(fromExtKey: string, toExtKey: string) {
    return this.http.delete(`callcenter/private/v3/extension/${fromExtKey}/delegate/${toExtKey}`);
  }
}
