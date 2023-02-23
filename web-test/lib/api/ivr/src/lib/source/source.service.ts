import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FetchSourceReq } from './fetch-source-req';
import { Source } from './source';

@Injectable({
  providedIn: 'root'
})
export class SourceService {
  constructor(private http: HttpClient) {}

  fetchIvrSources(params?: FetchSourceReq): Observable<Source[]> {
    return this.http
      .get<Source[]>(`workflow/private/v1/workflow/ivr/sources`, {
        params: params ? params.toParams() : null
      })
      .pipe(map(res => res.map(source => new Source(source))));
  }

  assign(number: string, workflowUuid: string): Observable<Source> {
    return this.http
      .post<Source>(`workflow/private/v1/workflow/ivr/sources/_assign`, {
        number: number,
        workflowUuid: workflowUuid
      })
      .pipe(map(res => new Source(res)));
  }

  unassign(number: string, workflowUuid: string): Observable<Source> {
    return this.http
      .post<Source>(`workflow/private/v1/workflow/ivr/sources/_unassign`, {
        number: number,
        workflowUuid: workflowUuid
      })
      .pipe(map(res => new Source(res)));
  }
}
