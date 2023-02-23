import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ActionDef } from '../action-def/action-def.model';
import { Connector, ConnectorReq, ConnectorSuggestionReq, SetConfigReq } from './connector.model';
import { ConnectorQuery } from './connector.query';
import { ConnectorStore } from './connector.store';

@Injectable({
  providedIn: 'root'
})
export class ConnectorService {
  constructor(private http: HttpClient, private store: ConnectorStore, private query: ConnectorQuery) {}

  getConnectors(req: ConnectorReq, isSimpleApp: boolean): Observable<Connector[]> {
    const params = new HttpParams().set('flowUuid', req.flowUuid).set('flowVersion', req.flowVersion?.toString());

    let linkApi = `flow/private/app/v2/connectors`;
    if (isSimpleApp) {
      linkApi = `flow/private/simpleApp/v1/connectors`;
    }

    return this.http
      .get<Connector[]>(linkApi, { params })
      .pipe(
        map(lst => lst.map(cnt => new Connector(cnt))),
        tap(lst => this.store.set(lst))
      );
  }

  getActionDefs(connectorUuid: string): Observable<ActionDef[]> {
    if (!this.store.getValue().entities[connectorUuid]?.actionDefs) {
      return this.http.get<ActionDef[]>(`flow/private/app/v1/connectors/${connectorUuid}/actionDefs`).pipe(
        tap(result => {
          this.store.update(connectorUuid, { actionDefs: result });
        })
      );
    } else {
      return this.query.selectActionDefs(connectorUuid);
    }
  }

  setConfigs(connectorUuid: string, configs: SetConfigReq): Observable<void> {
    return this.http.post<void>(`flow/private/app/v2/connectors/${connectorUuid}/userConfigs`, configs).pipe(
      tap(_ =>
        this.store.update(connectorUuid, {
          needToSetAuthInfo: false,
          authenticationInfo: configs.authenticationInfo,
          userMappings: configs.userMappings
        })
      )
    );
  }

  getConnectorsSuggestion(req: ConnectorSuggestionReq): Observable<Connector[]> {
    let params = new HttpParams();
    params = params.set('flowUuid', req.flowUuid);
    params = params.set('flowVersion', req.version?.toString());

    return this.http
      .get<Connector[]>(`flow/private/app/v2/connectors/active`, { params })
      .pipe(
        map(lst => lst.map(cnt => new Connector(cnt))),
        tap(connectorsSuggestion => {
          this.store.update(state => ({ ...state, ui: { ...state.ui, connectorsSuggestion } }));
        })
      );
  }

  addConnectorsToSuggestion(req: ConnectorSuggestionReq) {
    let params = new HttpParams();
    params = params.set('flowUuid', req.flowUuid);
    params = params.set('flowVersion', req.version?.toString());

    return this.http.post<Connector[]>(
      `flow/private/app/v2/connectors/active/add`,
      { connectorUuid: req?.connectorUuid },
      { params }
    );
  }

  removeConnectors(req: ConnectorSuggestionReq) {
    let params = new HttpParams();
    params = params.set('flowUuid', req.flowUuid);
    params = params.set('flowVersion', req.version?.toString());

    return this.http.post<Connector[]>(
      `flow/private/app/v2/connectors/active/remove`,
      { connectorUuid: req?.connectorUuid },
      { params }
    );
  }

  resetUI() {
    this.store.resetUI();
  }
}
