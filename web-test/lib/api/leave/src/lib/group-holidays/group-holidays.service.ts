import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { GroupHolidays, ReqGetGroupHolidays } from './group-holidays.model';
import { GroupHolidaysStore } from './group-holidays.store';

@Injectable({
  providedIn: 'root'
})
export class GroupHolidaysService {
  constructor(private http: HttpClient, private store: GroupHolidaysStore) {}

  getGroupHolidays(req: ReqGetGroupHolidays) {
    let params = new HttpParams();
    Object.keys(req).forEach(key => {
      if (!!req[key]) {
        params = params.append(key, req[key]);
      }
    });
    return this.http
      .get<GroupHolidays[]>(`leave/private/v1/group-holidays`, { params: params })
      .pipe(
        map(reqs => reqs.map(x => new GroupHolidays(x))),
        tap(reqs => this.store.upsertMany(reqs))
      );
  }

  createAndUpdateGroupHolidays(group: GroupHolidays) {
    return this.http.post<GroupHolidays>(`leave/private/v1/group-holidays`, group).pipe(
      map(req => new GroupHolidays(req)),
      tap(req => this.store.upsertMany([req]))
    );
  }

  deleteGroupHolidays(groupUuid: string) {
    const params = new HttpParams().append('groupUuid', groupUuid);
    return this.http
      .delete<GroupHolidays>(`leave/private/v1/group-holidays`, { params: params })
      .pipe(
        map(req => new GroupHolidays(req)),
        tap(req => this.store.upsertMany([req]))
      );
  }
}
