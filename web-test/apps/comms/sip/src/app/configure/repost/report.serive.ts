import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Pageable } from '../pagination/pagination';
import { DumpRequest } from './dump-req.model';
import { HistoryInfo } from './history-info';

@Injectable({ providedIn: 'root' })
export class ReportService {
  constructor(private http: HttpClient) {}

  searchLog(body: HistoryInfo, pageable: Pageable): Observable<any> {
    return this.http.post(
      `/data/private/query2/sipCalls.searchAll?page=${pageable.page}&perPage=${pageable.perPage}`,
      body
    );
  }

  export(body: DumpRequest) {
    return this.http.post('/data/private/stream/query2/sipCalls.searchAll', body, {
      observe: 'response',
      responseType: 'blob'
    });
  }
}
