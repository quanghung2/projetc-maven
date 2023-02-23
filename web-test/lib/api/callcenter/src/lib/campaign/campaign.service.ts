import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CampaignInfo } from './campaign';

export class FindCampaignReq {
  q?: string;
  status?: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  toParams(): HttpParams {
    let params = new HttpParams();
    if (this.q) {
      params = params.set('q', this.q);
    }
    if (this.status) {
      params = params.set('status', this.status);
    }

    return params;
  }
}

export interface UploadResponse {
  totalCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignService {
  constructor(private http: HttpClient) {}

  findCampaigns(req: FindCampaignReq): Observable<CampaignInfo[]> {
    req = Object.assign(new FindCampaignReq(), req) || new FindCampaignReq();

    const params = req.toParams();

    return this.http
      .get<CampaignInfo[]>(`callcenter/private/v1/campaigns`, { params: params })
      .pipe(map(list => list.map(cam => new CampaignInfo(cam))));
  }

  findCampaignsPage(req: FindCampaignReq, pageable?: Pageable): Observable<Page<CampaignInfo>> {
    req = Object.assign(new FindCampaignReq(), req) || new FindCampaignReq();

    let params = req.toParams();
    params = params.set('mode', 'pagination');
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('perPage', String(pageable.perPage));
    }

    return this.http
      .get<CampaignInfo[]>(`callcenter/private/v1/campaigns`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(response => {
          const page = new Page<CampaignInfo>();
          page.totalCount = +response.headers.get('x-pagination-total-count');
          page.content = response.body.map(cam => new CampaignInfo(cam));
          return page;
        })
      );
  }

  getCampaign(campaignUuid: string): Observable<CampaignInfo> {
    return this.http
      .get<CampaignInfo>(`callcenter/private/v1/campaigns/${campaignUuid}`)
      .pipe(map(res => new CampaignInfo(res)));
  }

  createCampaign(campaign: any) {
    return this.http.post(`callcenter/private/v1/campaigns`, campaign);
  }

  updateCampaign(uuid: string, body: CampaignInfo) {
    return this.http.put(`callcenter/private/v1/campaigns/${uuid}`, body);
  }

  upload(uuid: string, body: any): Observable<UploadResponse> {
    return this.http.post<UploadResponse>(`callcenter/private/v1/campaigns/${uuid}/upload`, body);
  }

  publishCampaign(uuid: string) {
    return this.http.put(`callcenter/private/v1/campaigns/${uuid}/_publish`, {});
  }

  pauseCampaign(uuid: string) {
    return this.http.put(`callcenter/private/v1/campaigns/${uuid}/_pause`, {});
  }

  finishCampaign(uuid: string) {
    return this.http.put(`callcenter/private/v1/campaigns/${uuid}/_finish`, {});
  }

  deleteCampaign(uuid: string) {
    return this.http.delete(`callcenter/private/v1/campaigns/${uuid}`);
  }

  checkDnc(campaignId: string) {
    return this.http.put(`callcenter/private/v1/campaigns/${campaignId}/_checkInAdvance`, {});
  }
}
