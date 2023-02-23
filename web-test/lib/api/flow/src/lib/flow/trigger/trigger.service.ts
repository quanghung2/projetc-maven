import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ReplaceRes } from '../actions/actions.model';
import { ExtendTriggerRes, Trigger, TriggerReq } from './trigger.model';
import { TriggerStore } from './trigger.store';

@Injectable({
  providedIn: 'root'
})
export class TriggerService {
  constructor(private http: HttpClient, private store: TriggerStore) {}

  createTrigger(flowUuid: string, version: number, req: TriggerReq): Observable<Trigger> {
    return this.http
      .post<Trigger>(`flow/private/app/v1/flows/${flowUuid}/${version}/trigger`, req)
      .pipe(tap(trigger => this.store.update(trigger)));
  }

  updateTrigger(flowUuid: string, version: number, req: TriggerReq): Observable<Trigger> {
    return this.http
      .put<Trigger>(`flow/private/app/v1/flows/${flowUuid}/${version}/trigger`, req)
      .pipe(tap(trigger => this.store.update(trigger)));
  }

  getTrigger(flowUuid: string, version: number) {
    return this.http
      .get<Trigger>(`flow/private/app/v1/flows/${flowUuid}/${version}/trigger`)
      .pipe(tap(trigger => this.store.update(trigger)));
  }

  replaceTrigger(flowUuid: string, version: number, req: TriggerReq) {
    return this.http.post<ReplaceRes>(`/flow/private/app/v1/flows/${flowUuid}/${version}/trigger/replace`, req);
  }

  extendTrigger(flowUuid: string, version: number, req: TriggerReq): Observable<ExtendTriggerRes> {
    return this.http
      .post<ExtendTriggerRes>(`flow/private/app/v1/flows/${flowUuid}/${version}/trigger/extend`, req)
      .pipe(
        tap(res => {
          if (res.status === 'ok') {
            this.store.update(res.trigger);
          }
        })
      );
  }
}
