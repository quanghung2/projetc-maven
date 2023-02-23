import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Peer } from './peer.model';

@Injectable({
  providedIn: 'root'
})
export class PeerService {
  constructor(private http: HttpClient) {}

  getPeer(cluster: string) {
    return this.http.get<Peer[]>(`/edge/private/v1/clusters/${cluster}/config/peer`);
  }

  createPeer(request: Peer, cluster: string) {
    return this.http.post(`/edge/private/v1/clusters/${cluster}/config/peer`, request);
  }

  updatePeer(request: Peer, cluster: string) {
    return this.http.put(`/edge/private/v1/clusters/${cluster}/config/peer`, request);
  }

  getDetailPeer(name: string, cluster: string): Observable<Peer> {
    return this.http.get<Peer>(`/edge/private/v1/clusters/${cluster}/config/peer/${name}`);
  }

  deletePeer(name: string, cluster: string) {
    return this.http.delete(`/edge/private/v1/clusters/${cluster}/config/peer/${name}`);
  }
}
