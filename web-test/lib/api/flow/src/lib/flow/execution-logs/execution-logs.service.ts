import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExecutionLog, GetLogsReq, GetLogsRes, GroupByLog, ViewDetailReq } from './execution-logs.model';
import { ExecutionLogsStore } from './execution-logs.store';

@Injectable({
  providedIn: 'root'
})
export class ExecutionLogsService {
  constructor(private http: HttpClient, private store: ExecutionLogsStore) {}

  private paramsForGetLogs(req: GetLogsReq) {
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
    if (req.version > 0) {
      params = params.set('version', String(req.version));
    }
    if (req.sortDirection) {
      params = params.set('sortDirection', req.sortDirection);
    }
    if (req.keyword) {
      params = params.set('keyword', req.keyword.trim().replace(/\s\s+/g, ' ').replace(/\s\t+/g, ' '));
    }
    this.store.update({ filterLogs: req });
    return params;
  }

  getExecutionLogsDone(flowUuid: string, req: GetLogsReq): Observable<GetLogsRes> {
    return this.http.get<GetLogsRes>(`/flow/private/app/v3/flows/${flowUuid}/execution-logs/done`, {
      params: this.paramsForGetLogs(req)
    });
  }

  getExecutionLogsDoneDetail(log: ViewDetailReq): Observable<ExecutionLog> {
    return this.http.get<ExecutionLog>(`flow/private/app/v3/flows/${log.flowUuid}/execution-logs/done/${log.id}`);
  }

  getExecutionLogsRunning(flowUuid: string, req: GetLogsReq): Observable<GetLogsRes> {
    if (!req.keyword) {
      return this.http.get<GetLogsRes>(`/flow/private/app/v3/flows/${flowUuid}/execution-logs/running`, {
        params: this.paramsForGetLogs(req)
      });
    }
    return new Observable<GetLogsRes>(observer => {
      observer.next({ data: [], nextCursor: null });
      observer.complete();
    });
  }

  getExecutionLogsRunningDetail(log: ViewDetailReq): Observable<ExecutionLog> {
    return this.http.get<ExecutionLog>(`flow/private/app/v3/flows/${log.flowUuid}/execution-logs/running/${log.id}`);
  }

  updateNextCursorRunning(nextCursor: number) {
    this.store.update({ nextCursorRunning: nextCursor });
  }

  updateNextCursorDone(nextCursor: number) {
    this.store.update({ nextCursorDone: nextCursor });
  }

  updateDataLogs(logs: (ExecutionLog | GroupByLog)[]) {
    this.store.update({ dataLogs: logs });
  }

  updateDataAdvancedLogs(logs: ExecutionLog[]) {
    this.store.update({ dataAdvancedLogs: logs });
  }

  reset() {
    this.store.reset();
  }
}
