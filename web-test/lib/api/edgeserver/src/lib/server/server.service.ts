import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Cluster } from '../cluster/cluster.model';
import { ClusterStore } from '../cluster/cluster.store';
import { Server } from './server.model';
import { ServerStore } from './server.store';

@Injectable({
  providedIn: 'root'
})
export class ServerService {
  constructor(private http: HttpClient, private store: ServerStore, private clusterStore: ClusterStore) {}

  getServer(): Observable<Server[]> {
    return this.http.get<Server[]>('/edge/private/v1/servers').pipe(
      map(lst => lst.map(es => new Server(es))),
      tap(lst => {
        lst.map(s => (s._idKey = lst.indexOf(s)));
        this.store.set(lst);
        const clusters = [...new Set(lst.map(s => s.cluster))];
        this.clusterStore.set(clusters.map(c => new Cluster({ cluster: c })));
        if (lst.length > 0) {
          this.clusterStore.setActive(lst[0].cluster);
        }
      })
    );
  }

  getProvision(domain: string): Observable<Server[]> {
    return this.http.get<Server[]>(`/edge/private/v1/servers/${domain}`);
  }

  deleteServer(req: Server) {
    return this.http.delete(`/edge/private/v1/servers/${req.domain}/${req.cluster}/${req.nodeName}`);
  }
}
