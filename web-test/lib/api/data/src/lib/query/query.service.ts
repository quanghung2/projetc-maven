import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FeedbackHistoryReq } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { Observable } from 'rxjs';
import { DumpReq } from './../report/dump-req.model';
import { Lastest5Calls, ReservationFilter, ReservationInfo } from './query.model';

@Injectable({
  providedIn: 'root'
})
export class QueryService {
  constructor(private http: HttpClient) {}

  fetchLastest5Calls(callerId: string) {
    return this.http.get<Lastest5Calls[]>(`data/private/query2/incoming.lastX?callerId=${callerId}&last=5`);
  }

  searchFeedbackHistory(body: FeedbackHistoryReq, pageable: Pageable) {
    const params: HttpParams = new HttpParams()
      .set('page', pageable.page.toString())
      .set('perPage', pageable.perPage.toString());
    return this.http.post('/data/private/query2/feedback.search', body, { params: params });
  }

  dump2CsvForFeedbacks(body: DumpReq) {
    return this.http.post('data/private/stream/query3/feedback.search', body, {
      observe: 'response',
      responseType: 'blob'
    });
  }

  getIntelligenceCall(filter: ReservationFilter, pageable: Pageable): Observable<ReservationInfo[]> {
    let httpParams = new HttpParams().append('page', `${pageable.page}`).append('perPage', `${pageable.perPage}`);
    Object.keys(filter).forEach(key => {
      if (filter[key]) {
        httpParams = httpParams.append(key, filter[key]);
      }
    });

    return this.http.get<ReservationInfo[]>('/data/private/query2/custom.unlistedBooking.search', {
      params: httpParams
    });
  }
}
