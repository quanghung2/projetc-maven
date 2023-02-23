import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SecurityProfile } from './security.model';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  constructor(private http: HttpClient) {}

  getSecurityProfile(cluster: string) {
    return this.http.get<SecurityProfile[]>(`/edge/private/v1/clusters/${cluster}/config/profile/security`);
  }

  createSecurityProfile(request: SecurityProfile, cluster: string) {
    return this.http.post(`/edge/private/v1/clusters/${cluster}/config/profile/security`, request);
  }

  updateSecurityProfile(request: SecurityProfile, cluster: string) {
    return this.http.put(`/edge/private/v1/clusters/${cluster}/config/profile/security`, request);
  }

  deleteSecurityProfile(name: string, cluster: string) {
    return this.http.delete(`/edge/private/v1/clusters/${cluster}/config/profile/security/${name}`);
  }
}
