import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Page, Pageable } from '@b3networks/api/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CampaignInfo } from '../campaign/campaign';
import { FindCampaignReq, UploadResponse } from '../campaign/campaign.service';
import { CampaignLicenseInfo } from './campaign-license.model';

@Injectable({
  providedIn: 'root'
})
export class CampaignLicenseService {
  constructor(private http: HttpClient) {}

  findCampaignsV2(req: FindCampaignReq): Observable<CampaignLicenseInfo[]> {
    req = Object.assign(new FindCampaignReq(), req) || new FindCampaignReq();

    const params = req.toParams();

    return this.http
      .get<CampaignLicenseInfo[]>(`callcenter/private/v2/campaigns`, { params: params })
      .pipe(map(list => list.map(cam => new CampaignLicenseInfo(cam))));
  }

  findCampaignsPageV2(req: FindCampaignReq, pageable?: Pageable): Observable<Page<CampaignLicenseInfo>> {
    req = Object.assign(new FindCampaignReq(), req) || new FindCampaignReq();

    let params = req.toParams();
    params = params.set('mode', 'pagination');
    if (pageable) {
      params = params.set('page', String(pageable.page)).set('perPage', String(pageable.perPage));
    }

    return this.http
      .get<CampaignLicenseInfo[]>(`callcenter/private/v2/campaigns`, {
        params: params,
        observe: 'response'
      })
      .pipe(
        map(response => {
          const page = new Page<CampaignLicenseInfo>();
          page.totalCount = +response.headers.get('x-pagination-total-count');
          page.content = response.body.map(cam => new CampaignLicenseInfo(cam));
          return page;
        })
      );
  }

  getCampaignV2(campaignUuid: string): Observable<CampaignLicenseInfo> {
    return this.http
      .get<CampaignLicenseInfo>(`callcenter/private/v2/campaigns/${campaignUuid}`)
      .pipe(map(res => new CampaignLicenseInfo(res)));
  }

  createCampaignV2(campaign: any) {
    return this.http.post<CampaignInfo>(`callcenter/private/v2/campaigns`, campaign);
  }

  updateCampaignV2(uuid: string, body: CampaignLicenseInfo) {
    return this.http.put<CampaignInfo>(`callcenter/private/v2/campaigns/${uuid}`, body);
  }

  uploadV2(uuid: string, body: any): Observable<UploadResponse> {
    return this.http.post<UploadResponse>(`callcenter/private/v2/campaigns/${uuid}/upload`, body);
  }

  pauseCampaignV2(uuid: string) {
    return this.http.put(`callcenter/private/v2/campaigns/${uuid}/_pause`, {});
  }

  deleteCampaignV2(uuid: string) {
    return this.http.delete(`callcenter/private/v2/campaigns/${uuid}`);
  }

  publishCampaignV2(uuid: string) {
    return this.http.put(`callcenter/private/v2/campaigns/${uuid}/_publish`, {});
  }

  finishCampaignV2(uuid: string) {
    return this.http.put(`callcenter/private/v2/campaigns/${uuid}/_finish`, {});
  }

  checkDncV2(campaignId: string) {
    return this.http.put<CampaignLicenseInfo>(`callcenter/private/v2/campaigns/${campaignId}/_checkInAdvance`, {});
  }
}
