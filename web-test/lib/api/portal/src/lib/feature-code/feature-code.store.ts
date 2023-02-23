import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { FeatureCode } from './feature-code.model';

export interface FeatureCodeState extends EntityState<FeatureCode> {
  loadedOrgs: string[];
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'portal_feature-code' })
export class FeatureCodeStore extends EntityStore<FeatureCodeState> {
  constructor() {
    super({ loadedOrgs: [] });
  }
}
