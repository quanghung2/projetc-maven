import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER, X_PAGINATION } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import {
  AssignNumberRequest,
  B3Number,
  CheckDocumentResult,
  FindNumberReq,
  ReserveNumberRequest
} from './number.model';
import { NumberStore } from './number.store';

@Injectable({ providedIn: 'root' })
export class NumberService {
  constructor(private numberStore: NumberStore, private http: HttpClient) {}

  findNumbers(req: FindNumberReq, pageable?: Pageable, promotedOrgUuid?: string): Observable<Page<B3Number>> {
    let headers = new HttpHeaders();
    if (!!promotedOrgUuid) {
      headers = headers.set(X_B3_HEADER.orgUuid, promotedOrgUuid);
    }
    req = Object.assign(new FindNumberReq(), req) || new FindNumberReq();

    let params = req.toParams();
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('perPage', String(pageable.perPage));
    }

    return this.http
      .get<B3Number[]>(`number/private/v2/numbers`, { headers: headers, params: params, observe: 'response' })
      .pipe(
        map(resp => {
          const page = new Page<B3Number>();
          page.totalCount = +resp.headers.get(X_PAGINATION.totalCount);
          page.content = resp.body.map(num => new B3Number(num));
          return page;
        }),
        tap(page => this.numberStore.set(page.content))
      );
  }

  setActive(numbers: B3Number[]) {
    this.numberStore.setActive(numbers.map(n => n.number));
  }

  makeActive(number: B3Number) {
    if (!this.numberStore.getValue().active) {
      this.numberStore.setActive([number.number]);
    } else {
      this.numberStore.addActive(number.number);
    }
  }

  removeActive(number: B3Number) {
    this.numberStore.removeActive(number.number);
  }

  getSkus(productId: string) {
    return this.http.get<string[]>(`number/public/v1/skus`, { params: { productId } });
  }

  checkDocument(numberSku: string, orgUuid: string) {
    let params = new HttpParams();
    params = params.set('skus', numberSku);
    params = params.set('orgUuid', orgUuid);

    return this.http.post<CheckDocumentResult[]>(`number/private/v3/check-document`, {}, { params });
  }

  // Store
  fetchPricingCodes(productId: string, voiceMode: string) {
    let params = new HttpParams();

    params = params.set('productCode', productId);
    params = params.set('capability', voiceMode);
    params = params.set('page', '1');
    params = params.set('perPage', '1000');

    return this.http.get(`number/private/v1/pricingCodes`, { params });
  }

  getPricingCodes(productId: string, capability: string, numberState?: string): Observable<string[]> {
    let numberStateCondition = numberState ? `&numberState=${numberState}` : '';

    return this.http.get<string[]>(
      `/number/private/v1/pricingCodes?productCode=${productId}&page=1&perPage=10000000&capability=${capability}${numberStateCondition}`
    );
  }

  assignNumber(number: string, assignNumberRequest: AssignNumberRequest): Observable<any> {
    return this.http.put(`/number/private/v1/numbers/${number}`, assignNumberRequest);
  }

  assignNumberV3(number: string, subscriptionUuid: string): Observable<any> {
    const url = `/number/private/v3/numbers/${number}/assign`;
    const body = {
      subscriptionUuid
    };

    return this.http.put<any>(url, body);
  }

  reserveNumber(number: string, reserveNumberRequest: ReserveNumberRequest): Observable<any> {
    return this.http.put(`/number/private/v1/numbers/${number}`, reserveNumberRequest);
  }

  reserveNumberV3(number: string, orgUuid: string): Observable<any> {
    return this.http.put(`/number/private/v3/numbers/${number}/reserve`, { orgUuid });
  }

  checkMultiDocument(skus: string[], orgUuid: string): Observable<CheckDocumentResult[]> {
    return this.http.post<CheckDocumentResult[]>(
      `/number/private/v3/check-document?skus=${skus.join(',')}&orgUuid=${orgUuid}`,
      {}
    );
  }

  calcActivationFee(numbers: string[]): Observable<number> {
    return this.http.post<number>(`/number/private/v2/numbers/calcOTC`, { numbers });
  }
}
