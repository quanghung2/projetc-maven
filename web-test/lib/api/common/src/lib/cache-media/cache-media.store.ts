import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { CacheMedia } from './cache-media.model';

export interface CachedMediaState extends EntityState<CacheMedia> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'common-cache-media', idKey: 'key' })
export class CacheMediaStore extends EntityStore<CachedMediaState> {
  constructor() {
    super();
  }
}
