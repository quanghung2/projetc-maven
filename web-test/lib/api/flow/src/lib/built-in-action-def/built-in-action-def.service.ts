import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ActionType, Output } from '../common.model';
import { BuiltInActionDefStore } from './built-in-action-def.store';

export class BuiltInActionDef {
  type: ActionType;
  outputs: Output[];
  description: string;

  constructor(obj?: Partial<BuiltInActionDef>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class BuiltInActionDefService {
  constructor(private http: HttpClient, private store: BuiltInActionDefStore) {}

  getBuiltInActionDefs(): Observable<BuiltInActionDef[]> {
    return this.http.get<BuiltInActionDef[]>(`/flow/private/app/v1/builtInActionDefs`).pipe(
      map(lst => lst.map(biad => new BuiltInActionDef(biad))),
      tap(lst => this.store.set(lst))
    );
  }
}
