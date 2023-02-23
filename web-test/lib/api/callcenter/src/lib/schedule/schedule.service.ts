import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ScheduleStatusResp, ScheduleUW } from './schedule.model';
import { ScheduleQuery } from './schedule.query';
import { ScheduleStore } from './schedule.store';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  constructor(private http: HttpClient, private store: ScheduleStore, private query: ScheduleQuery) {}

  getSchedule(identityUuid: string) {
    const req$ = this.http.get<ScheduleUW>(`callcenter/private/v1/schedule/identity/${identityUuid}`).pipe(
      map(
        schedule =>
          <ScheduleUW>{
            ...schedule,
            identityUuid: identityUuid
          }
      ),
      tap(schedule => {
        this.store.upsertMany([schedule]);
      })
    );

    return this.query.getByIdentityUuid(identityUuid) != null ? EMPTY : req$;
  }

  updateSchedule(identityUuid: string, data: ScheduleUW) {
    return this.http.put<ScheduleUW>(`callcenter/private/v1/schedule/identity/${identityUuid}`, data).pipe(
      map(
        _ =>
          <ScheduleUW>{
            ...data,
            identityUuid: identityUuid
          }
      ),
      tap(schedule => {
        this.store.upsertMany([schedule]);
      })
    );
  }

  getScheduleOrg() {
    return this.http.get<ScheduleUW>(`callcenter/private/v1/schedule/org`);
  }

  updateScheduleOrg(data: ScheduleUW) {
    return this.http.put<ScheduleUW>(`callcenter/private/v1/schedule/org`, data);
  }

  getScheduleStatusByExtKey(extKey: string): Observable<ScheduleStatusResp> {
    return this.http.get<ScheduleStatusResp>(`callcenter/private/v1/schedule/status/extension/${extKey}`);
  }
}
