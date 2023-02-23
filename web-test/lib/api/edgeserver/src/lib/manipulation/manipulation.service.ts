import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ManipulationProfile } from './manipulation.model';

@Injectable({
  providedIn: 'root'
})
export class ManipulationService {
  constructor(private http: HttpClient) {}

  getManipulation(cluster: string) {
    return this.http.get<ManipulationProfile[]>(`/edge/private/v1/clusters/${cluster}/config/profile/manipulation`);
  }

  createManipulation(request: ManipulationProfile, cluster: string) {
    return this.http.post(`/edge/private/v1/clusters/${cluster}/config/profile/manipulation`, request);
  }

  updateManipulation(request: ManipulationProfile, cluster: string) {
    return this.http.put(`/edge/private/v1/clusters/${cluster}/config/profile/manipulation`, request);
  }

  deleteManipulation(name: string, cluster: string) {
    return this.http.delete(`/edge/private/v1/clusters/${cluster}/config/profile/manipulation/${name}`);
  }
}
