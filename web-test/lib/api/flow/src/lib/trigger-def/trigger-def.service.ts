import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { TriggerDef } from './trigger-def.model';
import { TriggerDefStore } from './trigger-def.store';

@Injectable({
  providedIn: 'root'
})
export class TriggerDefService {
  constructor(private http: HttpClient, private store: TriggerDefStore) {}

  getAllTriggerDef(projectUuid: string, releaseGroupId: string): Observable<TriggerDef[]> {
    let linkApi = `flow/private/app/v2/triggerDefs`;
    let params = new HttpParams();

    // for Programmable Flow
    if (projectUuid) {
      linkApi = `flow/private/simpleApp/v1/triggerDefs`;
      params = params.set('projectUuid', projectUuid);
    }

    // for BA Creator
    if (releaseGroupId) {
      params = params.set('releaseGroupId', releaseGroupId);
    }

    return this.http.get<TriggerDef[]>(linkApi, { params: params }).pipe(
      map(lst => lst.map(trgd => new TriggerDef(trgd))),
      tap(lst => this.store.set(lst))
    );
  }

  getTriggerDef(uuid: string): Observable<TriggerDef> {
    return this.http.get<TriggerDef>(`flow/private/app/v1/triggerDefs/${uuid}`);
  }
}
