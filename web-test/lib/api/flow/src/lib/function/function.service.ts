import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { FunctionOperator, FunctionVariable } from './function.model';
import { FunctionStore } from './function.store';

@Injectable({
  providedIn: 'root'
})
export class FunctionService {
  constructor(private http: HttpClient, private store: FunctionStore) {}

  getFunction(): Observable<FunctionVariable[]> {
    return this.http.get<FunctionVariable[]>(`/flow/private/app/v1/functions`).pipe(
      map(lst => lst.map(fv => new FunctionVariable(fv))),
      tap(lst => this.store.set(lst))
    );
  }

  getFuntionTransform(): Observable<FunctionVariable[]> {
    return this.http
      .get<FunctionVariable[]>(`/flow/private/app/v1/functions/transformers`)
      .pipe(tap(lst => lst.map(f => (f.token = `function - ${f.token}`))));
  }

  getFunctionOperators(): Observable<FunctionOperator[]> {
    return this.http.get<FunctionOperator[]>(`flow/private/app/v1/functions/operators`);
  }
}
