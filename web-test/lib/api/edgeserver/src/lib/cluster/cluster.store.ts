import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Cluster } from './cluster.model';

export interface ClusterState extends EntityState<Cluster>, ActiveState {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'edge_cluster', idKey: 'cluster' })
export class ClusterStore extends EntityStore<ClusterState> {
  constructor() {
    super();
  }
}
