import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { CaseRouting, CreateUpdateRoutingRuleReq } from './case-routing.model';
import { CaseRoutingStore } from './case-routing.store';

@Injectable({
  providedIn: 'root'
})
export class CaseRoutingService {
  constructor(private http: HttpClient, private store: CaseRoutingStore) {}

  getAll() {
    return this.http.get<CaseRouting[]>('inbox/private/v1/support-center/cases/routing').pipe(
      map(res => res.map(response => new CaseRouting(response))),
      tap(routings => {
        this.store.set(routings);
      })
    );
  }

  createRouting(req: CreateUpdateRoutingRuleReq) {
    return this.http.post<CaseRouting>('inbox/private/v1/support-center/cases/routing', req).pipe(
      map(data => new CaseRouting(data)),
      tap(res => {
        this.store.upsertMany([res], { baseClass: CaseRouting });
      })
    );
  }

  updateRouting(id: string, req: CreateUpdateRoutingRuleReq) {
    return this.http.put<CaseRouting>(`inbox/private/v1/support-center/cases/routing/${id}`, req).pipe(
      map(data => new CaseRouting(data)),
      tap(res => {
        this.store.upsertMany([res], { baseClass: CaseRouting });
      })
    );
  }

  deleteRouting(id: string) {
    return this.http
      .delete(`inbox/private/v1/support-center/cases/routing/${id}`)
      .pipe(tap(() => this.store.remove(id)));
  }
}
