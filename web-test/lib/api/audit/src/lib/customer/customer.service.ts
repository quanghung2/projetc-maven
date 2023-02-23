import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page } from '@b3networks/api/common';
import { X_PAGINATION } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { AuditEventName, AuditFilter, AuditSearchLogRequest } from './customer.model';
import { CustomerStore } from './customer.store';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  constructor(private http: HttpClient, private customerStore: CustomerStore) {}

  getEventName(): Observable<AuditEventName[]> {
    this.customerStore.setLoading(true);
    return this.http.get<AuditEventName[]>('/audit/private/v1/customer/eventName').pipe(
      map(response => response.map(item => new AuditEventName(item))),
      tap(audits => {
        this.customerStore.set(audits);
      }),
      finalize(() => this.customerStore.setLoading(false))
    );
  }

  searchLog(request: AuditSearchLogRequest): Observable<Page<any>> {
    let requestParam = new HttpParams();
    Object.keys(request).forEach(key => {
      if (request[key]) {
        requestParam = requestParam.append(key, String(request[key]));
      }
    });

    this.customerStore.setLoading(true);
    return this.http.get('/audit/private/v1/customer/logs', { params: requestParam, observe: 'response' }).pipe(
      finalize(() => this.customerStore.setLoading(false)),
      map(response => {
        const page = new Page<any>();
        page.content = response.body as any;
        page.totalCount = +response.headers.get(X_PAGINATION.totalCount);
        return page;
      })
    );
  }

  updateAuditFilter(obj: Partial<AuditFilter>) {
    if (obj) {
      this.customerStore.updateAuditFilter(obj);
    }
  }
}
