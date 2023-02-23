import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CodecProfile } from './codec.model';

@Injectable({
  providedIn: 'root'
})
export class CodecService {
  constructor(private http: HttpClient) {}

  getCodecProfile(cluster: string) {
    return this.http.get<CodecProfile[]>(`/edge/private/v1/clusters/${cluster}/config/profile/codec`);
  }

  createCodecProfile(request: CodecProfile, cluster: string) {
    return this.http.post(`/edge/private/v1/clusters/${cluster}/config/profile/codec`, request);
  }

  updateCodecProfile(request: CodecProfile, cluster: string) {
    return this.http.put(`/edge/private/v1/clusters/${cluster}/config/profile/codec`, request);
  }

  deleteCodecProfile(name: string, cluster: string) {
    return this.http.delete(`/edge/private/v1/clusters/${cluster}/config/profile/codec/${name}`);
  }
}
