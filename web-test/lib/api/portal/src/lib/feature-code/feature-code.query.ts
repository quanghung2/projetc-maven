import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { map, share } from 'rxjs/operators';
import { createFeatureId } from './feature-code.model';
import { FeatureCodeState, FeatureCodeStore } from './feature-code.store';

@Injectable({ providedIn: 'root' })
export class FeatureCodeQuery extends QueryEntity<FeatureCodeState> {
  constructor(protected override store: FeatureCodeStore) {
    super(store);
  }

  selectAllByOrgUuid(orgUuid: string) {
    return this.selectAll({ filterBy: e => e.orgUuid === orgUuid }).pipe(
      map(list => list.map(f => f.featureCode)),
      share()
    );
  }

  selectFeature(orgUuid: string, feature: string) {
    return this.selectEntity(createFeatureId(orgUuid, feature));
  }

  hasFeature(orgUuid: string, feature: string) {
    return this.getEntity(createFeatureId(orgUuid, feature)) != null;
  }

  isUnloaded(orgUuid) {
    return this.getValue().loadedOrgs.indexOf(orgUuid) === -1;
  }

  isLoaded(orgUuid) {
    return !this.isUnloaded(orgUuid);
  }
}
