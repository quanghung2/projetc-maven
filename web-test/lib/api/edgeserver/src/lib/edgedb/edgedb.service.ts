import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EdgeDbService {
  constructor(private http: HttpClient) {}

  backup(cluster: string) {
    return this.http.get(`/edge/private/v1/clusters/${cluster}/debug/edgedb`, {
      responseType: 'blob'
    });
  }

  restore(cluster: string, strJson: string) {
    return this.http.post(`/edge/private/v1/clusters/${cluster}/debug/edgedb`, strJson);
  }
}
