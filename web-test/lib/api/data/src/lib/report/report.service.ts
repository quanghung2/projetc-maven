import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DomainUtilsService } from '@b3networks/shared/common';
import { Period, Report, ReportReq } from './report.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  constructor(private http: HttpClient, private domainUtil: DomainUtilsService) {}

  fetchReportsV2() {
    return this.http.get<Report[]>('data/private/report2/list');
  }

  generateDownloadCsvUrl(req: ReportReq, addon: { orgUuid: string; sessionToken }) {
    const params = [`sessionToken=${addon.sessionToken}`, `orgUuid=${addon.orgUuid}`];
    if (req.code.period === Period['1d']) {
      params.push(`startDate=${req.startTime}`, `endDate=${req.endTime}`);
    } else {
      params.push(`startTime=${req.startTime}`, `endTime=${req.endTime}`);
    }
    return `${this.domainUtil.apiUrl}/data/private/report2/${req.code.period}/${req.code.code}/csv?${params.join('&')}`;
  }
}
