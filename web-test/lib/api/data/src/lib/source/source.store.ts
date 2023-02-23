import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Source } from './source.model';

export interface SourceState extends EntityState<Source> {}
@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'datamanagement_source' })
export class SourceStore extends EntityStore<SourceState> {
  constructor() {
    super();
  }
}
