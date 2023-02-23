import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Tree } from './tree';

@Injectable({
  providedIn: 'root'
})
export class CallflowService {
  constructor(private http: HttpClient) {}

  findFlows(uuids?: string[]): Observable<CallFlow[]> {
    const params = uuids ? { uuids: uuids.toString() } : undefined;
    return this.http
      .get<CallFlow[]>(`workflow/private/v1/ivrFlows`, { params: params })
      .pipe(map(resp => resp.map(flow => new CallFlow(flow))));
  }

  getFlow(uuid: string): Observable<CallFlow> {
    return this.http.get<CallFlow>(`workflow/private/v1/ivrFlows/${uuid}`).pipe(map(flow => new CallFlow(flow)));
  }

  createFlow(flow: CallFlow): Observable<CallFlow> {
    return this.http.post<CallFlow>(`workflow/private/v1/ivrFlows`, flow).pipe(map(flow => new CallFlow(flow)));
  }

  deleteFlows(ids: string): Observable<CallFlow> {
    return this.http.delete(`workflow/private/v1/ivrFlows/${ids}`, {}).pipe(map(flow => new CallFlow(flow)));
  }

  getFlowConfigMap() {
    return this.http.get(`private/v1/ivrFlows/config`, {});
  }

  getFlowTree(id: string): Observable<Tree> {
    return this.http.get<Tree>(`workflow/private/v1/ivrFlows/${id}/tree`).pipe(map(tree => new Tree(tree)));
  }

  changeFlowLabel(flowId: string, label: string): Observable<CallFlow> {
    const body: any = {
      label: label
    };
    return this.http
      .put<CallFlow>(`workflow/private/v1/ivrFlows/${flowId}`, body)
      .pipe(map(flow => new CallFlow(flow)));
  }

  exportFlow(flowUuid: string): Observable<any> {
    return this.http.get(`workflow/private/v1/ivrFlows/${flowUuid}/_export`, {
      responseType: 'blob'
    });
  }

  importFlow(flowUuid: string, file: File): Observable<CallFlow> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    return this.http
      .post<CallFlow>(`workflow/private/v1/ivrFlows/${flowUuid}/_import`, formData, {
        headers: { Accept: 'application/json' }
      })
      .pipe(map(flow => new CallFlow(flow)));
  }
}

export class CallFlow {
  uuid: string;
  orgUuid: string;
  label: string;
  firstBlockUuid: string;
  version: number;
  createdAt: number;
  updatedAt: number;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}
