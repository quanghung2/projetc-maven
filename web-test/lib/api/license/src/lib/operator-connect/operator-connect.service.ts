import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_PAGINATION } from '@b3networks/shared/common';
import { map } from 'rxjs/operators';
import { GetOperatorConnectNumbersReq, OperatorConnectNumbers } from './operator-connect.model';

@Injectable({
  providedIn: 'root'
})
export class LicenseOperatorConnectNumberService {
  constructor(private http: HttpClient) {}

  getOperatorConnectNumbers(query?: GetOperatorConnectNumbersReq, pageable?: Pageable) {
    let params = new HttpParams();
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('perPage', String(pageable.perPage));
    }

    if (query) {
      Object.keys(query).forEach(key => {
        if (query[key] !== undefined && query[key] !== null) {
          params = params.set(key, query[key]);
        }
      });
    }

    return this.http
      .get<OperatorConnectNumbers[]>(`license/private/v1/operatorConnect/numbers`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const page = new Page<OperatorConnectNumbers>();
          page.content = resp.body.map(number => new OperatorConnectNumbers(number));
          page.totalCount = +resp.headers.get(X_PAGINATION.totalCount);
          return page;
        })
      );
  }

  uploadNumbersToMicrosoft(number: string) {
    return this.http.post(`license/private/v1/operatorConnect/numbers/upload`, {
      numbers: [number]
    });
  }
}
