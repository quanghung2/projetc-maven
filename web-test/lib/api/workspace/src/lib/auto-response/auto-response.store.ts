import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { AutoResponse } from './auto-response.model';

export interface AutoResponseState extends EntityState<AutoResponse> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_auto_response', idKey: 'event' })
export class AutoResponseStore extends EntityStore<AutoResponseState> {
  constructor() {
    super();
  }
}
