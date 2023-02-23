import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Action, GetActionReq } from './actions/actions.model';
import {
  Breadcrumb,
  CreateFlowReq,
  ExportFlowReq,
  ExportFlowRes,
  Flow,
  FlowActionReq,
  FlowWarning,
  GetVariablesReq,
  ImportFlowReq,
  SamePathActionsRes,
  TreeNode,
  UpdateFlowReq,
  VariableForAction
} from './flow.model';
import { FlowStore } from './flow.store';

@Injectable({
  providedIn: 'root'
})
export class FlowService {
  constructor(private http: HttpClient, private store: FlowStore) {}

  private appName(isSimpleApp: boolean) {
    return isSimpleApp ? 'simpleApp' : 'app';
  }

  getFlows(isArchived, pageable?: Pageable): Observable<Flow[]> {
    if (!pageable) {
      pageable = { perPage: 1000, page: 0 };
    }
    const params = new HttpParams()
      .set('page', String(pageable.page))
      .set('size', String(pageable.perPage))
      .set('isArchived', String(isArchived));
    return this.http
      .get<Flow[]>(`flow/private/app/v1/flows`, {
        params: params
      })
      .pipe(map(flows => flows.map(flow => new Flow(flow))));
  }

  createFlow(req: CreateFlowReq, isSimpleApp: boolean = false): Observable<Flow> {
    return this.http.post<Flow>(`flow/private/${this.appName(isSimpleApp)}/v1/flows`, req);
  }

  updateFlow(params: FlowActionReq, req: UpdateFlowReq): Observable<Flow> {
    return this.http.put<Flow>(`flow/private/app/v1/flows/${params.flowUuid}/${params.version}`, req).pipe(
      map(flow => new Flow(flow)),
      tap(flow => this.store.update(flow))
    );
  }

  renameFlow(params: FlowActionReq, name: string): Observable<Flow> {
    return this.http
      .put<Flow>(`flow/private/app/v1/flows/${params.flowUuid}/${params.version}/edit-general`, { name: name })
      .pipe(
        map(flow => new Flow(flow)),
        tap(flow => this.store.update(flow))
      );
  }

  getFlowDetail(req: FlowActionReq, saveStore: boolean = true): Observable<Flow> {
    return this.http.get<Flow>(`flow/private/app/v1/flows/${req.flowUuid}/${req.version}`).pipe(
      map(res => new Flow(res)),
      tap(flow => {
        if (saveStore) {
          this.store.update(flow);
          this.store.update({
            draftName: flow.draftName,
            draftVersion: flow.draftVersion,
            presentName: flow.presentName
          });
          this.store.updateUI('viewLogVersion', req.version);
          this.store.updateUIAction([], 0, undefined);
        }
      })
    );
  }

  deployFlow(req: FlowActionReq, isSimpleApp: boolean = false): Observable<Flow> {
    return this.http
      .post<Flow>(`flow/private/${this.appName(isSimpleApp)}/v1/flows/${req.flowUuid}/${req.version}/activate`, null)
      .pipe(tap(flow => this.store.update(flow)));
  }

  archiveFlow(req: FlowActionReq): Observable<Flow> {
    return this.http
      .post<Flow>(`flow/private/app/v1/flows/${req.flowUuid}/${req.version}/deactivate`, null)
      .pipe(tap(flow => this.store.update(flow)));
  }

  deleteFlow(flowUuid: string): Observable<Flow> {
    return this.http.post<Flow>(`flow/private/app/v1/flows/${flowUuid}/delete`, null);
  }

  getVersions(flowUuid: string): Observable<number[]> {
    return this.http.get<number[]>(`flow/private/app/v1/flows/${flowUuid}/versions`);
  }

  createNewVersion(req: FlowActionReq): Observable<Flow> {
    return this.http
      .post<Flow>(`flow/private/app/v1/flows/${req.flowUuid}/${req.version}/beginEditing`, null)
      .pipe(tap(flow => this.store.update(flow)));
  }

  getActions(req: GetActionReq): Observable<SamePathActionsRes> {
    const params = req.pathId ? new HttpParams().set('pathId', req.pathId) : null;
    return this.http
      .get<SamePathActionsRes>(`flow/private/app/v3/flows/${req.flowUuid}/${req.version}/samePathActions`, {
        params: params
      })
      .pipe(
        tap(result => {
          this.store.updateUIAction(result.actionsInTheSamePath, result.totalActions);
        })
      );
  }

  getBreadcrumb(req: GetActionReq): Observable<Breadcrumb[]> {
    return this.http
      .get<Breadcrumb[]>(`flow/private/app/v2/flows/${req.flowUuid}/${req.version}/breadcrumb?pathId=${req.pathId}`)
      .pipe(tap(result => this.store.updateUI('breadcrumb', result)));
  }

  getContextVariables(req: GetVariablesReq): Observable<VariableForAction[]> {
    let params = new HttpParams();
    params = params.set('flowUuid', req.flowUuid);
    params = params.set('flowVersion', String(req.flowVersion));
    if (req.prevActionUuid) {
      params = params.set('prevActionUuid', req.prevActionUuid);
    }
    if (req.currentActionUuid) {
      params = params.set('currentActionUuid', req.currentActionUuid);
    }

    return this.http
      .get<VariableForAction[]>(`flow/private/app/v1/flows/selectableDynamicVars/action`, { params: params })
      .pipe(
        map(lst => {
          const result: VariableForAction[] = [];
          lst.forEach(e => {
            if (e.properties.length > 0) {
              result.push(new VariableForAction(e));
            }
          });
          return result;
        }),
        tap(lst =>
          lst.map(vfa => {
            vfa.index = lst.indexOf(vfa);
            vfa.properties.map(p => (p.actionNameAndTitle = `${vfa.number}. ${vfa.actionName}: ${p.title}`));
          })
        )
      );
  }

  getFlowWarning(req: FlowActionReq) {
    return this.http.get<FlowWarning[]>(`flow/private/app/v1/flows/${req.flowUuid}/${req.version}/warnings`);
  }

  getMenuTree(flowUuid: string, version: number) {
    return this.http
      .get<TreeNode[]>(`flow/private/app/v1/flows/${flowUuid}/${version}/overviewTree`)
      .pipe(tap(trees => this.store.updateUI('nodeTrees', trees)));
  }

  exportFlow(req: ExportFlowReq): Observable<ExportFlowRes> {
    return this.http.post<ExportFlowRes>(`flow/private/app/v1/exportFlow`, req);
  }

  importFlow(req: ImportFlowReq): Observable<Flow> {
    return this.http.post<Flow>(`flow/private/app/v1/importFlow`, req);
  }

  setTreeNodeSelected(tree: TreeNode) {
    this.store.updateUI('treeNodeSelected', tree);
  }

  resetTreeNodeSelected() {
    this.store.updateUI('treeNodeSelected', null);
  }

  setActionSelected(action: Action) {
    this.store.updateUI('actionSelected', action);
  }

  setViewLogVersion(version: number) {
    this.store.updateUI('viewLogVersion', version);
  }

  reset() {
    this.store.reset();
  }
}
