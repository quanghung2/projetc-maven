import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ClusterState, ClusterStore } from './cluster.store';

@Injectable({ providedIn: 'root' })
export class ClusterQuery extends QueryEntity<ClusterState> {
  constructor(protected override store: ClusterStore) {
    super(store);
  }
}
