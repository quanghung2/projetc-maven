import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CampaignTxn } from './campaign-txn';

export interface FindCampainTxnReq {
  q: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignTxnService {
  constructor(private http: HttpClient) {}

  updateCampaign(uuid: string, body: any) {
    return this.http.put(`callcenter/private/v1/campaigns/${uuid}/txns`, body);
  }

  findCampaignTxns(campaignUuid: string, req: FindCampainTxnReq, pageable: Pageable): Observable<Page<CampaignTxn>> {
    return this.http
      .get<CampaignTxn[]>(`callcenter/private/v1/campaigns/${campaignUuid}/txns`, {
        observe: 'response',
        params: {
          page: String(pageable.page),
          perPage: String(pageable.perPage),
          q: req.q ? req.q : '',
          status: req.status ? req.status : ''
        }
      })
      .pipe(
        map(res => {
          const result = new Page<CampaignTxn>();
          result.content = res.body.map(txn => new CampaignTxn(txn));
          result.totalCount = +res.headers.get(`x-pagination-total-count`);
          return result;
        })
      );
  }

  findCampaignTxnsV2(campaignUuid: string, req: FindCampainTxnReq, pageable: Pageable): Observable<Page<CampaignTxn>> {
    return this.http
      .get<CampaignTxn[]>(`callcenter/private/v2/campaigns/${campaignUuid}/txns`, {
        observe: 'response',
        params: {
          page: String(pageable.page),
          perPage: String(pageable.perPage),
          q: req.q ? req.q : '',
          status: req.status ? req.status : ''
        }
      })
      .pipe(
        map(res => {
          const result = new Page<CampaignTxn>();
          result.content = res.body.map(txn => new CampaignTxn(txn));
          result.totalCount = +res.headers.get(`x-pagination-total-count`);
          return result;
        })
      );
  }
}
