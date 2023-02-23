import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { HashMap, PaginationResponse } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CreateResourceReq,
  CreateResourcesReq,
  CreateResourcesResp,
  GetLicenseReq,
  License,
  LicenseResource
} from './license.model';

@Injectable({
  providedIn: 'root'
})
export class LicenseService {
  constructor(private http: HttpClient) {}

  getLicenses(req: GetLicenseReq, pageable?: Pageable): Observable<Page<License>> {
    let params = new HttpParams().set('includeMappings', 'true').set('includeResources', 'true');

    if (req) {
      Object.keys(req)
        .filter(key => req[key] != null)
        .forEach(key => {
          if (key === 'skus') {
            params = req[key].length ? params.set('skus', req[key].join(',')) : params;
          } else {
            params = params.set(key, req[key]);
          }
        });
    }
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('size', String(pageable.perPage));
    }

    return this.http.get<License[]>(`license/private/v2/licenses`, { params: params, observe: 'response' }).pipe(
      map(resp => {
        const content = resp.body.map(l => new License(l));
        const totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
        return {
          totalCount: totalCount,
          content: content
        } as Page<License>;
      })
    );
  }

  getLicense(id: number) {
    const params = new HttpParams().set('includeMappings', 'true').set('includeResources', 'true');
    return this.http.get<License>(`license/private/v2/licenses/${id}`, { params });
  }

  assignUser(licenseId: number, identityUuid: string) {
    return this.http.put<void>(`license/private/v2/licenses/${licenseId}/assign`, { identityUuid: identityUuid });
  }

  unassignUser(licenseId: number) {
    return this.http.put<void>(`license/private/v2/licenses/${licenseId}/unassign`, null);
  }

  getAvailableAddons(
    baseSkus: string[],
    addonSkus: string[],
    pageable?: Pageable
  ): Observable<PaginationResponse<License>> {
    let params = new HttpParams().set('includeResources', 'true');

    if (baseSkus && baseSkus.length) {
      params = params.set('baseSkus', baseSkus.join(','));
    }

    if (addonSkus && addonSkus.length) {
      params = params.set('addonSkus', addonSkus.join(','));
    }

    if (pageable) {
      params = params.set('page', pageable.page.toString());
      params = params.set('size', pageable.perPage.toString());
    }

    return this.http
      .get<License[]>(`license/private/v2/licenses/available`, { params: params, observe: 'response' })
      .pipe(
        map(res => {
          return <PaginationResponse<License>>{
            data: res.body.map(l => new License(l)),
            total: +res.headers.get(X_B3_HEADER.totalCount)
          };
        })
      );
  }

  /**
   * @param skus //TODO: deprecated
   * @param baseSkus
   * @param addonSkus
   * @param isAddonAssigned
   * @param isDeviceAddon
   * @param sort //! Sort by number assigned time
   * @param includeResources,
   */
  getAvailableAddonsWithFilter(
    baseSkus?: string[],
    addonSkus?: string[],
    isDeviceAddon?: boolean,
    isAddonAssigned?: boolean,
    pageable?: Pageable
  ) {
    let params = new HttpParams().set('includeResources', 'true');

    if (baseSkus && baseSkus.length) {
      params = params.set('baseSkus', baseSkus.join(','));
    }

    if (addonSkus && addonSkus.length) {
      params = params.set('addonSkus', addonSkus.join(','));
    }

    params = params.set('isAddonAssigned', isAddonAssigned.toString());

    if (isDeviceAddon) {
      params = params.set('isDeviceAddon', isDeviceAddon.toString());
    }

    if (pageable) {
      params = params.set('page', pageable.page.toString());
      params = params.set('size', pageable.perPage.toString());
    }

    return this.http
      .get<License[]>(`license/private/v2/licenses/resources/available`, { params: params, observe: 'response' })
      .pipe(
        map(res => {
          return <PaginationResponse<License>>{
            data: res.body.map(l => new License(l)),
            total: +res.headers.get(X_B3_HEADER.totalCount)
          };
        })
      );
  }

  assignAddon(licenseId: number, addonId: number) {
    return this.http.post<void>(`license/private/v2/licenses/${licenseId}/addons/${addonId}/mapping`, null);
  }

  unassignAddon(licenseId: number, addonId: number) {
    return this.http.delete<void>(`license/private/v2/licenses/${licenseId}/addons/${addonId}/mapping`);
  }

  createResource(licenseId: number, body: CreateResourceReq, type: 'extension' | 'number') {
    return this.http.post<void>(`license/private/v2/licenses/${licenseId}/resources/${type}`, body);
  }

  createBulkResources(req: CreateResourcesReq) {
    return this.http.post<CreateResourcesResp>(`license/private/v2/resources/${req.type}`, req);
  }

  updateResource(licenseId: number, body: CreateResourceReq, type: 'extension' | 'number') {
    return this.http.put<void>(`license/private/v2/licenses/${licenseId}/resources/${type}`, body);
  }

  getResource(licenseIds: number[]): Observable<LicenseResource[]> {
    let params = new HttpParams();
    params = params.set('licenseIds', licenseIds.join(','));
    return this.http.get<LicenseResource[]>(`license/private/v2/resources`, { params: params });
  }

  getMappingConfig(sku: string): Observable<HashMap<number>> {
    return this.http.get<{ sku: string; quantity: number }[]>(`license/private/v2/mapping-config?sku=${sku}`).pipe(
      map(list => {
        const result: HashMap<number> = {};
        list.forEach(i => {
          result[i.sku] = i.quantity;
        });
        return result;
      })
    );
  }

  getAssignedNumbersByIdentityUuid(identityUuid: string): Observable<string[]> {
    const params = new HttpParams().set('identityUuid', identityUuid);
    return this.http.get<string[]>(`license/private/v1/assigned-numbers`, { params: params });
  }

  unprovision(licenseId: number): Observable<void> {
    return this.http.post<void>(`license/private/v1/decompose-license/${licenseId}`, {});
  }

  getLicenseFilterByFeature(baseFeatures: string, addonFeatures: string) {
    return this.http.get<License[]>(`license/private/v2/licenses/filter-by-features`, {
      params: { baseFeatures, addonFeatures }
    });
  }

  deleteExt(extKey: string) {
    return this.http.delete<void>(`license/private/v2/resources/extensions/${extKey}`);
  }
}
