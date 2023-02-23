import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Flow, FlowActionReq, SimpleFlow, VariableForAction } from '../flow/flow.model';
import { FlowStore } from '../flow/flow.store';
import {
  BaCreatorActionDef,
  BaCreatorMutex,
  BaInputParams,
  CreateNewBaCreatorReq,
  MappedEvent,
  ReleaseGroup,
  SetMappedEventReq
} from './bacreator.model';
import { MapEventStore } from './map-event.store';

@Injectable({
  providedIn: 'root'
})
export class BaCreatorService {
  constructor(private http: HttpClient, private flowStore: FlowStore, private mapEventStore: MapEventStore) {}

  getBusinessAction(pageable: Pageable, keyword: string): Observable<Page<SimpleFlow>> {
    let params = new HttpParams().set('page', String(pageable.page)).set('size', String(pageable.perPage));
    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http
      .get<SimpleFlow[]>(`flow/private/bacreator/v1/businessActions`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const page = new Page<SimpleFlow>();
          page.content = resp.body.map(sf => new SimpleFlow(sf));
          page.totalCount = +resp.headers.get(X_B3_HEADER.totalCount);
          return page;
        })
      );
  }

  createFlow(): Observable<Flow> {
    return this.http.post<Flow>(`flow/private/bacreator/v1/flows`, {});
  }

  createBaCreator(req: CreateNewBaCreatorReq): Observable<Flow> {
    return this.http.post<Flow>(`flow/private/bacreator/v1/businessActions`, req).pipe(
      tap(flow => {
        this.flowStore.update(flow);
      })
    );
  }

  editBaCreator(flowUuid: string, version: number, req: { presentName: string }): Observable<Flow> {
    return this.http
      .put<Flow>(`flow/private/bacreator/v1/businessActions/${flowUuid}/${version}/edit-general`, req)
      .pipe(
        tap(flow => {
          this.flowStore.update(flow);
        })
      );
  }

  getMappedEvents(baFlowUuid: string): Observable<MappedEvent[]> {
    const params = new HttpParams().set('baFlowUuid', baFlowUuid);
    return this.http.get<MappedEvent[]>(`flow/private/bacreator/v1/businessActionLinks`, { params: params });
  }

  setActiveMapEvent(me: MappedEvent) {
    this.mapEventStore.update(me);
  }

  resetMapEvent() {
    this.mapEventStore.reset();
  }

  getDynamicVars(triggerDefUuid: string): Observable<VariableForAction[]> {
    const params = new HttpParams().set('triggerDefUuid', triggerDefUuid);
    return this.http
      .get<VariableForAction[]>(`flow/private/app/v1/selectableDynamicVars/businessActionLink`, { params: params })
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
            vfa.properties.map(p => (p.actionNameAndTitle = `${vfa.actionName}: ${p.title}`));
          })
        )
      );
  }

  getInputParams(req: FlowActionReq): Observable<BaInputParams[]> {
    return this.http.get<BaInputParams[]>(
      `flow/private/bacreator/v1/businessActions/${req.flowUuid}/${req.version}/inputParams`
    );
  }

  setMappedEvent(req: SetMappedEventReq): Observable<void> {
    return this.http.post<void>(`flow/private/bacreator/v1/businessActionLinks`, req);
  }

  deprecateMappedEvent(id: number): Observable<void> {
    return this.http.delete<void>(`flow/private/bacreator/v1/businessActionLinks/${id}`);
  }

  getBaActionDef(): Observable<BaCreatorActionDef[]> {
    return this.http.get<BaCreatorActionDef[]>(`flow/private/bacreator/v1/baActionDefs/forMutexConfigs`);
  }

  getAllBaMutex(): Observable<BaCreatorMutex[]> {
    return this.http.get<BaCreatorMutex[]>(`flow/private/bacreator/v1/businessActions/mutexes`);
  }

  createBaMutex(group: string[]): Observable<void> {
    return this.http.post<void>(`flow/private/bacreator/v1/businessActions/mutexes`, { group });
  }

  updateBaMutex(id: number, group: string[]): Observable<void> {
    return this.http.put<void>(`flow/private/bacreator/v1/businessActions/mutexes/${id}`, { group });
  }

  deleteBaMutex(id: number): Observable<void> {
    return this.http.delete<void>(`flow/private/bacreator/v1/businessActions/mutexes/${id}`);
  }

  getReleaseGroups(): Observable<ReleaseGroup[]> {
    return this.http.get<ReleaseGroup[]>(`flow/private/bacreator/v1/release-groups`);
  }
}
