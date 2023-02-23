import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { BuiltInActionDef } from './built-in-action-def.service';

export interface BuiltInActionDefState extends EntityState<BuiltInActionDef> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_builtInActionDef', idKey: 'type' })
export class BuiltInActionDefStore extends EntityStore<BuiltInActionDefState> {
  constructor() {
    super();
  }
}
