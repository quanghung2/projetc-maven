import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { FunctionState, FunctionStore } from './function.store';

@Injectable({ providedIn: 'root' })
export class FunctionQuery extends QueryEntity<FunctionState> {
  constructor(protected override store: FunctionStore) {
    super(store);
  }
}
