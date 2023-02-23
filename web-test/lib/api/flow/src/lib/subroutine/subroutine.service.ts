import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CreateSubroutineReq, Flow } from '../flow/flow.model';
import { FlowStore } from '../flow/flow.store';

@Injectable({
  providedIn: 'root'
})
export class SubroutineService {
  constructor(private http: HttpClient, private flowStore: FlowStore) {}

  createSubroutine(req: CreateSubroutineReq) {
    return this.http.post<Flow>(`flow/private/app/v1/subroutines`, req).pipe(
      tap(flow => {
        this.flowStore.update(flow);
      })
    );
  }

  getCallers(subroutineUuid: string): Observable<Flow[]> {
    return this.http.get<Flow[]>(`flow/private/app/v1/subroutines/${subroutineUuid}/callers`);
  }
}
