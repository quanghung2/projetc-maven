import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { BuiltInActionDefState, BuiltInActionDefStore } from './built-in-action-def.store';

@Injectable({ providedIn: 'root' })
export class BuiltInActionDefQuery extends QueryEntity<BuiltInActionDefState> {
  constructor(protected override store: BuiltInActionDefStore) {
    super(store);
  }
}
