import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { format, subDays } from 'date-fns';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Txn } from './txn';

class FetchHistoriesResp {
  txns: Txn[];
}

@Injectable({ providedIn: 'root' })
export class HistoryService {
  constructor(private http: HttpClient) {}

  public fetchHistories(searchRequest: SearchRequest, pageable: Pageable): Observable<Page<Txn>> {
    const params: any = {
      from: searchRequest.from,
      to: searchRequest.to,
      timezone: searchRequest.timezone,
      query: searchRequest.query,
      workflow_uuid: searchRequest.workflowUuid,
      appId: searchRequest.appId,
      filters: searchRequest.filters.join(','),
      page: String(pageable.page),
      perPage: String(pageable.perPage)
    };
    return this.http
      .get<FetchHistoriesResp>(`workflow/private/v1/txns`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(resp => {
          const result = new Page<Txn>();
          result.content = resp.body.txns.map(txn => new Txn(txn));
          result.totalCount = +resp.headers.get('x-pagination-total-count');
          return result;
        })
      );
  }

  public getVoiceMailURL(txnUuid: string): Observable<VoiceMailRes> {
    return this.http
      .get<VoiceMailRes>(`workflow/private/v1/txns/${txnUuid}/voicemail`)
      .pipe(map(res => new VoiceMailRes(res)));
  }

  export(exportRequest) {
    const body = <ExportRequest>{
      from: exportRequest.from,
      to: exportRequest.to,
      workFlowUuid: exportRequest.workFlowUuid,
      emails: exportRequest.emails,
      query: exportRequest.query
    };
    return this.http.post(`workflow/private/v1/txns/export`, body);
  }
}

export class VoiceMailRes {
  url: string;

  constructor(params?: VoiceMailRes) {
    if (params) {
      this.url = params.url;
    }
  }
}

export class ExportRequest {
  from: number;
  to: number;
  workFlowUuid: string;
  emails: string[] = [];
  query: string;
}

export class SearchRequest {
  public from: number;
  public to: number;
  timezone: string;
  public query: string;
  public workflowUuid: string;
  public appId: string;
  public filters: string[] = [];

  constructor() {
    this.from = Number(format(subDays(new Date(), 1), 'T'));
    this.to = Number(format(new Date(), 'T'));
    this.query = '';
    this.workflowUuid = '';
    this.appId = '';
  }
}
