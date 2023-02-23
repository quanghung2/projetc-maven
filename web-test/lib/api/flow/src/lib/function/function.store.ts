import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { FunctionVariable } from './function.model';

export interface FunctionState extends EntityState<FunctionVariable> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_function', idKey: 'token' })
export class FunctionStore extends EntityStore<FunctionState> {
  constructor() {
    super();
  }
}
