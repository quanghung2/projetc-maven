import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { HeaderRelayProfile } from './header-relay.model';

@Injectable({
  providedIn: 'root'
})
export class HeaderRelayService {
  constructor(private http: HttpClient) {}

  getHeaderRelayProfile(cluster: string) {
    return this.http.get<HeaderRelayProfile[]>(`/edge/private/v1/clusters/${cluster}/config/profile/relay`);
  }

  createHeaderRelayProfile(headerRelay: HeaderRelayProfile, cluster: string) {
    return this.http.post(`/edge/private/v1/clusters/${cluster}/config/profile/relay`, headerRelay);
  }

  updateHeaderRelayProfile(headerRelay: HeaderRelayProfile, cluster: string) {
    return this.http.put(`/edge/private/v1/clusters/${cluster}/config/profile/relay`, headerRelay);
  }

  deleteHeaderRelayProfile(name: string, cluster: string) {
    return this.http.delete(`/edge/private/v1/clusters/${cluster}/config/profile/relay/${name}`);
  }
}
