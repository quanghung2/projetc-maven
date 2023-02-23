import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { GetActionReq } from '../actions/actions.model';
import { ExecutionLog, GetLogsReq, GetLogsRes, GroupByLog } from '../execution-logs/execution-logs.model';
import { Flow, SamePathActionsRes, SimpleFlow } from '../flow.model';
import { FlowStore } from '../flow.store';
import { LogStore } from './log.store';
import { FlowVersionMapping, SubscriptionForProject } from './simple-app.model';

@Injectable({
  providedIn: 'root'
})
export class SimpleAppFlowService {
  constructor(private http: HttpClient, private store: FlowStore, private logStore: LogStore) {}

  getFlows(tag: string, pageable: Pageable): Observable<Page<SimpleFlow>> {
    const params = new HttpParams()
      .set('tag', tag)
      .set('page', String(pageable.page))
      .set('size', String(pageable.perPage));

    return this.http
      .get<SimpleFlow[]>(`/flow/private/simpleApp/v2/flows`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const page = new Page<SimpleFlow>();
          page.content = resp.body.map(flow => new SimpleFlow(flow));
          page.totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return page;
        })
      );
  }

  getActiveFlows(tag: string): Observable<Flow[]> {
    const params = new HttpParams().set('tag', tag);
    return this.http.get<Flow[]>(`/flow/private/simpleApp/v2/activeFlows`, {
      params: params
    });
  }

  getFlowsByCampaign(triggerDefUuids: string, tag?: string): Observable<Flow[]> {
    let params = new HttpParams().set('triggerDefUuids', triggerDefUuids);
    if (tag) {
      params = params.append('tag', tag);
    }
    return this.http.get<Flow[]>(`/flow/private/simpleApp/v2/activeFlows`, {
      params: params
    });
  }

  getActions(req: GetActionReq): Observable<SamePathActionsRes> {
    const params = req.pathId ? new HttpParams().set('pathId', req.pathId) : null;
    return this.http
      .get<SamePathActionsRes>(`/flow/private/simpleApp/v1/flows/${req.flowUuid}/${req.version}/samePathActions`, {
        params: params
      })
      .pipe(
        tap(result => {
          this.store.updateUIAction(result.actionsInTheSamePath, result.totalActions, result.usableInjectionTokensList);
        })
      );
  }

  getSubscriptions(): Observable<SubscriptionForProject[]> {
    return this.http.get<SubscriptionForProject[]>(`flow/private/simpleApp/v2/subscriptions`);
  }

  // start log
  getFlowVersionMapping(projectUuid: string): Observable<FlowVersionMapping[]> {
    return this.http.get<FlowVersionMapping[]>(
      `flow/private/simpleApp/v1/projects/${projectUuid}/execution-logs/flow-version-mappings`
    );
  }

  paramsForGetLogs(req: GetLogsReq) {
    let params = new HttpParams().set('size', String(req.size));
    if (req.startTime) {
      params = params.set('startTime', String(req.startTime));
    }
    if (req.endTime) {
      params = params.set('endTime', String(req.endTime));
    }
    if (req.nextCursor) {
      params = params.set('nextCursor', String(req.nextCursor));
    }
    if (req.flowUuid) {
      params = params.set('flowUuid', req.flowUuid);
    }
    if (req.version > 0) {
      params = params.set('version', String(req.version));
    }
    if (req.status) {
      params = params.set('status', req.status);
    }
    if (req.sortDirection) {
      params = params.set('sortDirection', req.sortDirection);
    }
    if (req.keyword) {
      params = params.set('keyword', req.keyword.trim().replace(/\s\s+/g, ' ').replace(/\s\t+/g, ' '));
    }
    this.logStore.update({ filterLogs: req });
    return params;
  }

  getLogRunning(projectUuid: string, req: GetLogsReq): Observable<GetLogsRes> {
    if (!req.keyword) {
      return this.http.get<GetLogsRes>(`flow/private/simpleApp/v1/projects/${projectUuid}/execution-logs/running`, {
        params: this.paramsForGetLogs(req)
      });
    }
    return new Observable<GetLogsRes>(observer => {
      observer.next({ data: [], nextCursor: null });
      observer.complete();
    });
  }

  getLogDone(projectUuid: string, req: GetLogsReq): Observable<GetLogsRes> {
    if (req.status !== 'running') {
      return this.http.get<GetLogsRes>(`flow/private/simpleApp/v1/projects/${projectUuid}/execution-logs/done`, {
        params: this.paramsForGetLogs(req)
      });
    }
    return new Observable<GetLogsRes>(observer => {
      observer.next({ data: [], nextCursor: null });
      observer.complete();
    });
  }

  updateNextCursorRunning(nextCursor: number) {
    this.logStore.update({ nextCursorRunning: nextCursor });
  }

  updateNextCursorDone(nextCursor: number) {
    this.logStore.update({ nextCursorDone: nextCursor });
  }

  updateDataLogs(logs: (ExecutionLog | GroupByLog)[]) {
    this.logStore.update({ dataLogs: logs });
  }

  resetLog() {
    this.logStore.reset();
  }
  // end central log
}
