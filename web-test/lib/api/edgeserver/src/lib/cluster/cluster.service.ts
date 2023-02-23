import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Cluster } from './cluster.model';
import { ClusterStore } from './cluster.store';

@Injectable({
  providedIn: 'root'
})
export class ClusterService {
  constructor(private http: HttpClient, private store: ClusterStore) {}

  selectCluster(cluster: Cluster) {
    this.store.setActive(cluster.cluster);
  }
}
