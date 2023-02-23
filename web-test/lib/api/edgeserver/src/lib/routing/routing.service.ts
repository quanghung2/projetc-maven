import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  Context,
  CRURoutingReq,
  DeleteClidRoutingReq,
  DeleteDnisRoutingReq,
  Record,
  Routing,
  Table
} from './routing.model';

@Injectable({
  providedIn: 'root'
})
export class RoutingService {
  constructor(private http: HttpClient) {}

  getDnisRouting(request: CRURoutingReq, cluster: string): Observable<Routing[]> {
    return this.http.get<Routing[]>(
      `/edge/private/v1/clusters/${cluster}/config/routing/digit/${request.context}/${request.planname}/dnis`
    );
  }

  createDnisRouting(request: CRURoutingReq, body: Routing, cluster: string) {
    return this.http.post(
      `/edge/private/v1/clusters/${cluster}/config/routing/digit/${request.context}/${request.planname}/dnis`,
      body
    );
  }

  updateDnisRouting(request: CRURoutingReq, body: Routing, cluster: string) {
    return this.http.put(
      `/edge/private/v1/clusters/${cluster}/config/routing/digit/${request.context}/${request.planname}/dnis`,
      body
    );
  }

  deleteDnisRouting(request: DeleteDnisRoutingReq, cluster: string) {
    return this.http.delete(
      `/edge/private/v1/clusters/${cluster}/config/routing/digit/${request.context}/${request.planname}/dnis/${request.dnis}/${request.matching}`
    );
  }

  getClidRouting(request: CRURoutingReq, cluster: string): Observable<Routing[]> {
    return this.http.get<Routing[]>(
      `/edge/private/v1/clusters/${cluster}/config/routing/digit/${request.context}/${request.planname}/clid`
    );
  }

  createClidRouting(request: CRURoutingReq, body: Routing, cluster: string) {
    return this.http.post(
      `/edge/private/v1/clusters/${cluster}/config/routing/digit/${request.context}/${request.planname}/clid`,
      body
    );
  }

  updateClidRouting(request: CRURoutingReq, body: Routing, cluster: string) {
    return this.http.put(
      `/edge/private/v1/clusters/${cluster}/config/routing/digit/${request.context}/${request.planname}/clid`,
      body
    );
  }

  deleteClidRouting(request: DeleteClidRoutingReq, cluster: string) {
    return this.http.delete(
      `/edge/private/v1/clusters/${cluster}/config/routing/digit/${request.context}/${request.planname}/clid/${request.clid}/${request.tag}/${request.matching}`
    );
  }

  getTable(cluster: string): Observable<Table[]> {
    return this.http.get<Table[]>(`/edge/private/v1/clusters/${cluster}/config/routing/${Context.inside}/tables`);
  }

  getDetailTable(cluster: string, tableName: string): Observable<Table> {
    return this.http.get<Table>(
      `/edge/private/v1/clusters/${cluster}/config/routing/${Context.inside}/tables/${tableName}`
    );
  }

  createRecordRouting(cluster: string, tableName: string, req: Record): Observable<Record> {
    return this.http.post<Record>(
      `/edge/private/v1/clusters/${cluster}/config/routing/${Context.inside}/tables/${tableName}/records`,
      req
    );
  }

  updateRecordRouting(cluster: string, tableName: string, req: Record): Observable<Record> {
    return this.http.put<Record>(
      `/edge/private/v1/clusters/${cluster}/config/routing/${Context.inside}/tables/${tableName}/records`,
      req
    );
  }

  deleteRecordRouting(cluster: string, tableName: string, req: Record): Observable<void> {
    return this.http.delete<void>(
      `/edge/private/v1/clusters/${cluster}/config/routing/${Context.inside}/tables/${tableName}/records/${req.matching}/${req.value}`
    );
  }
}
