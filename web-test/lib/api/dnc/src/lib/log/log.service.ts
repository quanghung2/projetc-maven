import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { RESULT_DPO } from './log.constants';
import { DPOLookup, LogBulkFiltering, LookupNumber, LookupRate, LookupRateReq, MediumStatus } from './log.model';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  constructor(private http: HttpClient) {}

  activityLogs(number: string) {
    const encode = encodeURIComponent(number);
    return this.http.get<LogBulkFiltering[]>(`dnc/private/v3/lookup/${encode}`).pipe(
      map(resp => {
        console.log('resp: ', resp);
        return resp;
      })
    );
  }

  lookupRate(req: LookupRateReq) {
    let params = new HttpParams();
    Object.keys(req).forEach(key => {
      params = params.append(key, req[key]);
    });
    return this.http.get<LookupRate>(`dnc/api/v2/private/lookupRate`, {
      params: params
    });
  }

  lookupRateSearch(prefix: string, medium: MediumStatus) {
    return this.http
      .post<DPOLookup>(`dnc/private/v3/dpoLookup`, {
        number: prefix,
        medium: medium
      })
      .pipe(map(x => ({ ...x, medium: medium })));
  }

  lookupNumberV3(number: string, from: number, to: number) {
    const params = new HttpParams().append('start', from).append('end', to);
    return this.http
      .get<{ entries: LookupNumber[] }>(`dnc/private/v3/lookup/${encodeURIComponent(number)}`, {
        params: params
      })
      .pipe(map(resp => resp?.entries?.map(x => ({ ...x, displayResult: RESULT_DPO?.[x.result]?.[x.cause] })) || []));
  }
}
