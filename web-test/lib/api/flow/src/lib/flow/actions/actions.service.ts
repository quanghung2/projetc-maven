import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Output } from '../../common.model';
import {
  Action,
  DeleteActionReq,
  GetActionReq,
  ReplaceActionReq,
  ReplaceRes,
  TypeAction,
  UpdateActionReq
} from './actions.model';

@Injectable({
  providedIn: 'root'
})
export class ActionsService {
  constructor(private http: HttpClient) {}

  private appName(isSimpleApp: boolean) {
    return isSimpleApp ? 'simpleApp' : 'app';
  }

  addAction(flowUuid: string, version: number, req: TypeAction, isSimpleApp: boolean): Observable<typeof req> {
    return this.http.post<typeof req>(
      `flow/private/${this.appName(isSimpleApp)}/v1/flows/${flowUuid}/${version}/actions`,
      req
    );
  }

  getOutputAction(req: GetActionReq): Observable<Output[]> {
    return this.http.get<Output[]>(
      `flow/private/app/v1/flows/${req.flowUuid}/${req.version}/actions/${req.actionUuid}/outputProperties`
    );
  }

  getAction(req: GetActionReq): Observable<TypeAction> {
    return this.http.get<TypeAction>(
      `flow/private/app/v1/flows/${req.flowUuid}/${req.version}/actions/${req.actionUuid}`
    );
  }

  updateAction(req: UpdateActionReq, isSimpleApp: boolean): Observable<typeof req.body> {
    return this.http.put<typeof req.body>(
      `/flow/private/${this.appName(isSimpleApp)}/v1/flows/${req.params.flowUuid}/${req.params.version}/actions/${
        req.actionUuid
      }`,
      req.body
    );
  }

  deleteAction(req: DeleteActionReq): Observable<void> {
    return this.http.delete<void>(
      `/flow/private/app/v1/flows/${req.flowUuid}/${req.version}/actions/${req.actionUuid}`
    );
  }

  safeDeleteAction(req: DeleteActionReq) {
    return this.http.put<ReplaceRes>(
      `/flow/private/app/v2/flows/${req.flowUuid}/${req.version}/actions/${req.actionUuid}/safeDelete`,
      req.body || {}
    );
  }

  replaceAction(req: ReplaceActionReq, isSimpleApp: boolean) {
    let linkApi = `/flow/private/app/v2/flows/${req.params.flowUuid}/${req.params.version}/actions/${req.actionUuid}/replace`;
    if (isSimpleApp) {
      linkApi = `/flow/private/simpleApp/v1/flows/${req.params.flowUuid}/${req.params.version}/actions/${req.actionUuid}/replace`;
    }
    return this.http.put<ReplaceRes>(linkApi, req.body);
  }

  getActionsByUUIDs(req: GetActionReq) {
    let params = new HttpParams();
    if (req.uuids.length) {
      params = params.set('uuid', `${req.uuids?.join(',')}`);
    }
    return this.http.get<Action[]>(`/flow/private/app/v2/flows/${req.flowUuid}/${req.version}/actions`, {
      params
    });
  }
}
