import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DoNetCapReq } from './netcap.model';

@Injectable({
  providedIn: 'root'
})
export class NetCapService {
  constructor(private http: HttpClient) {}

  getNetCap(cluster: string) {
    return this.http.get<any>(`/edge/private/v1/clusters/${cluster}/debug/netcap`);
  }

  doNetCap(req: DoNetCapReq, cluster: string) {
    return this.http.post(`/edge/private/v1/clusters/${cluster}/debug/netcap`, req);
  }

  downloadNetCap(fileName: string, cluster: string, nodeName: string) {
    return this.http.get(`/edge/private/v1/clusters/${cluster}/debug/netcap/files/${nodeName}/${fileName}`, {
      responseType: 'blob'
    });
  }

  deleteNetCap(fileName: string, cluster: string) {
    return this.http.delete(`/edge/private/v1/clusters/${cluster}/debug/netcap/${fileName}`);
  }
}
