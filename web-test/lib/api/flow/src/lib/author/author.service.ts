import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { VariableForAction } from '../flow/flow.model';
import {
  AuthorActionDef,
  AuthorConnector,
  AuthorDataSource,
  AuthorTriggerDef,
  CreateAuthorActionDef,
  CreateAuthorConnectorReq,
  CreateAuthorDataSource,
  CreateAuthorTriggerDef,
  TriggerLinkRes,
  UpdateDefGeneral,
  VerifyChangedData
} from './author.model';
import { AuthorConnectorStore } from './connector.store';
import { AuthorDataSourceStore } from './datasource.store';

@Injectable({
  providedIn: 'root'
})
export class AuthorService {
  constructor(
    private http: HttpClient,
    private store: AuthorConnectorStore,
    private dataSourceStore: AuthorDataSourceStore
  ) {}

  // Connectors
  getListConnector(pageable: Pageable): Observable<Page<AuthorConnector>> {
    const params = new HttpParams().set('page', String(pageable.page)).set('size', String(pageable.perPage));
    return this.http
      .get<AuthorConnector[]>(`/flow/private/app/v1/author/connectors`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const page = new Page<AuthorConnector>();
          page.content = resp.body.map(sub => new AuthorConnector(sub));
          page.totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return page;
        })
      );
  }

  getConnector(uuid: string): Observable<AuthorConnector> {
    return this.http.get<AuthorConnector>(`flow/private/app/v1/author/connectors/${uuid}`).pipe(
      map(res => new AuthorConnector(res)),
      tap(connector => this.store.update(connector))
    );
  }

  createConnector(req: CreateAuthorConnectorReq): Observable<AuthorConnector> {
    return this.http
      .post<AuthorConnector>(`flow/private/app/v1/author/connectors`, req)
      .pipe(map(res => new AuthorConnector(res)));
  }

  updateConnector(uuid: string, req: CreateAuthorConnectorReq): Observable<AuthorConnector> {
    return this.http.put<AuthorConnector>(`flow/private/app/v1/author/connectors/${uuid}`, req).pipe(
      map(res => new AuthorConnector(res)),
      tap(connector => this.store.update(connector))
    );
  }

  setActiveConnector(connector: AuthorConnector) {
    this.store.update(connector);
  }

  //TriggerDef
  getListTriggerDef(uuid: string): Observable<AuthorTriggerDef[]> {
    return this.http
      .get<AuthorTriggerDef[]>(`/flow/private/app/v1/author/connectors/${uuid}/triggerDefs`)
      .pipe(map(triggerDefs => triggerDefs.map(t => new AuthorTriggerDef(t))));
  }

  createTrigger(connectorUuid: string, req: CreateAuthorTriggerDef): Observable<AuthorTriggerDef> {
    return this.http
      .post<AuthorTriggerDef>(`/flow/private/app/v1/author/connectors/${connectorUuid}/triggerDefs`, req)
      .pipe(map(res => new AuthorTriggerDef(res)));
  }

  updateTrigger(
    connectorUuid: string,
    triggerDefUuid: string,
    req: CreateAuthorTriggerDef
  ): Observable<AuthorTriggerDef> {
    return this.http
      .put<AuthorTriggerDef>(
        `/flow/private/app/v1/author/connectors/${connectorUuid}/triggerDefs/${triggerDefUuid}`,
        req
      )
      .pipe(map(res => new AuthorTriggerDef(res)));
  }

  updateTriggerDefGeneral(
    connectorUuid: string,
    triggerDefUuid: string,
    req: UpdateDefGeneral
  ): Observable<AuthorTriggerDef> {
    return this.http.put<AuthorTriggerDef>(
      `/flow/private/app/v1/author/connectors/${connectorUuid}/triggerDefs/${triggerDefUuid}/edit-general`,
      req
    );
  }

  postDefTrigger(connectorUuid: string, actionDefUuid: string) {
    return this.http.post(
      `flow/private/app/v1/author/connectors/${connectorUuid}/triggerDefs/${actionDefUuid}/deprecate`,
      {}
    );
  }

  verifyChangesTriggerDefs(
    connectorUuid: string,
    actionDefUuid: string,
    req: CreateAuthorTriggerDef
  ): Observable<VerifyChangedData> {
    return this.http.post<VerifyChangedData>(
      `/flow/private/app/v1/author/connectors/${connectorUuid}/triggerDefs/${actionDefUuid}/verifyChanges`,
      req
    );
  }

  //ActionDef
  getListActionDef(uuid: string): Observable<AuthorActionDef[]> {
    return this.http
      .get<AuthorActionDef[]>(`/flow/private/app/v1/author/connectors/${uuid}/actionDefs`)
      .pipe(map(actionDefs => actionDefs.map(t => new AuthorActionDef(t))));
  }

  getActionDef(connectorUuid: string, actionDefUuid: string): Observable<AuthorActionDef> {
    return this.http
      .get<AuthorActionDef>(`/flow/private/app/v1/author/connectors/${connectorUuid}/actionDefs/${actionDefUuid}`)
      .pipe(map(actionDef => new AuthorActionDef(actionDef)));
  }

  createAction(connectorUuid: string, req: CreateAuthorActionDef): Observable<AuthorActionDef> {
    return this.http
      .post<AuthorActionDef>(`/flow/private/app/v1/author/connectors/${connectorUuid}/actionDefs`, req)
      .pipe(map(res => new AuthorActionDef(res)));
  }

  updateAction(connectorUuid: string, actionDefUuid: string, req: CreateAuthorActionDef): Observable<AuthorActionDef> {
    return this.http
      .put<AuthorActionDef>(`/flow/private/app/v1/author/connectors/${connectorUuid}/actionDefs/${actionDefUuid}`, req)
      .pipe(map(res => new AuthorActionDef(res)));
  }

  updateActionDefGeneral(
    connectorUuid: string,
    actionDefUuid: string,
    req: UpdateDefGeneral
  ): Observable<AuthorActionDef> {
    return this.http.put<AuthorActionDef>(
      `/flow/private/app/v1/author/connectors/${connectorUuid}/actionDefs/${actionDefUuid}/edit-general`,
      req
    );
  }

  postDefAction(connectorUuid: string, actionDefUuid: string) {
    return this.http.post(
      `flow/private/app/v1/author/connectors/${connectorUuid}/actionDefs/${actionDefUuid}/deprecate`,
      {}
    );
  }

  verifyChangesActionDefs(
    connectorUuid: string,
    actionDefUuid: string,
    req: CreateAuthorActionDef
  ): Observable<VerifyChangedData> {
    return this.http.post<VerifyChangedData>(
      `/flow/private/app/v1/author/connectors/${connectorUuid}/actionDefs/${actionDefUuid}/verifyChanges`,
      req
    );
  }

  getTriggerLink(connectorUuid: string, actionDefUuid: string) {
    return this.http.get<TriggerLinkRes[]>(
      `flow/private/app/v2/author/connectors/${connectorUuid}/actionDefs/${actionDefUuid}/triggerLinks`
    );
  }

  setTriggerLink(connectorUuid: string, actionDefUuid: string, req: { triggerDefUuidsWillBeTriggered: string[] }) {
    return this.http.put<TriggerLinkRes[]>(
      `flow/private/app/v2/author/connectors/${connectorUuid}/actionDefs/${actionDefUuid}/triggerLinks`,
      req
    );
  }

  //DataSource
  getListDataSource(uuid: string): Observable<AuthorDataSource[]> {
    return this.http.get<AuthorDataSource[]>(`flow/private/app/v1/author/connectors/${uuid}/dataSources`).pipe(
      map(dataSources => dataSources.map(t => new AuthorDataSource(t))),
      tap(dataSources => this.dataSourceStore.set(dataSources))
    );
  }

  createDataSource(connectorUuid: string, req: CreateAuthorDataSource): Observable<AuthorDataSource> {
    return this.http
      .post<AuthorDataSource>(`/flow/private/app/v1/author/connectors/${connectorUuid}/dataSources`, req)
      .pipe(
        map(res => new AuthorDataSource(res)),
        tap(res => this.dataSourceStore.add(res))
      );
  }

  updateDataSource(
    connectorUuid: string,
    dataSourceUuid: string,
    req: CreateAuthorDataSource
  ): Observable<AuthorDataSource> {
    return this.http
      .put<AuthorDataSource>(
        `/flow/private/app/v1/author/connectors/${connectorUuid}/dataSources/${dataSourceUuid}`,
        req
      )
      .pipe(
        map(res => new AuthorDataSource(res)),
        tap(res => this.dataSourceStore.update(dataSourceUuid, res))
      );
  }

  //getDynamicVars
  private mapContextVariables(x: Observable<VariableForAction[]>) {
    return x.pipe(
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
          vfa.properties.map(p => (p.actionNameAndTitle = `${vfa.actionName}: ${p.title}`));
        })
      )
    );
  }

  getDynamicVarsTriggerDef(uuid: string): Observable<VariableForAction[]> {
    return this.mapContextVariables(
      this.http.get<VariableForAction[]>(
        `/flow/private/app/v1/author/connectors/${uuid}/selectableDynamicVars/triggerDef`
      )
    );
  }

  getDynamicVarsActionDef(uuid: string): Observable<VariableForAction[]> {
    return this.mapContextVariables(
      this.http.get<VariableForAction[]>(
        `/flow/private/app/v1/author/connectors/${uuid}/selectableDynamicVars/actionDef`
      )
    );
  }

  getDynamicVarsDataSource(uuid: string): Observable<VariableForAction[]> {
    return this.mapContextVariables(
      this.http.get<VariableForAction[]>(
        `/flow/private/app/v1/author/connectors/${uuid}/selectableDynamicVars/dataSourceDef`
      )
    );
  }

  reset() {
    this.store.reset();
  }
}
