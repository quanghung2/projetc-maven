import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Feature } from './feature.model';

export function createInitialState(): Feature {
  return {
    licenses: []
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'license_feature' })
export class FeatureStore extends Store<Feature> {
  constructor() {
    super(createInitialState());
  }
}
