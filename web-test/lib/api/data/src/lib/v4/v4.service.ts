import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pageable } from '@b3networks/api/common';
import { DomainUtilsService, X_B3_HEADER } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Period } from '../report/report.model';
import {
  ArchiveTxnPayload,
  FormattedV4Report,
  GetReportV4Payload,
  ReportV4Code,
  ReportV4Resp,
  StateReport
} from './v4.model';

type ReportV4SupportedCode = ReportV4Code | string;

@Injectable({
  providedIn: 'root'
})
export class V4Service {
  constructor(private http: HttpClient, private domainUtil: DomainUtilsService) {}

  getFormattedReports() {
    return this.http
      .get<FormattedV4Report[]>('data/private/v4/formatted')
      .pipe(map(list => list.map(report => new FormattedV4Report(report))));
  }

  getTransactions<T>(
    period: Period,
    reportCode: ReportV4SupportedCode,
    body: GetReportV4Payload,
    pageable?: Pageable
  ): Observable<T[]> {
    let params = new HttpParams();
    if (pageable) {
      params = pageable.page > -1 ? params.set('page', String(pageable.page)) : params;
      params = pageable.perPage > 0 ? params.set('perPage', String(pageable.perPage)) : params;
    }

    return this.http.post<T[]>(`data/private/v4/raw/${period}/${reportCode}`, body, { params: params });
  }

  getReportData<T>(
    period: Period,
    reportCode: ReportV4SupportedCode,
    body: GetReportV4Payload,
    pageable?: Pageable,
    formatted: boolean = true
  ): Observable<ReportV4Resp<T>> {
    const reportType = formatted ? 'formatted' : 'unformatted';

    let params = new HttpParams();
    if (pageable) {
      params = pageable.page > -1 ? params.set('page', String(pageable.page)) : params;
      params = pageable.perPage > 0 ? params.set('perPage', String(pageable.perPage)) : params;
    }

    return this.http
      .post<ReportV4Resp<T>>(`data/private/v4/${reportType}/${period}/${reportCode}`, body, { params: params })
      .pipe(map(resp => new ReportV4Resp(resp)));
  }

  downloadReport2(
    period: Period,
    reportCode: ReportV4SupportedCode,
    req: GetReportV4Payload,
    cred: { orgUuid; sessionToken }
  ) {
    const params = new HttpParams()
      .set(X_B3_HEADER.sessionToken, cred.sessionToken)
      .set(X_B3_HEADER.orgUuid, cred.orgUuid);

    return this.http.post(`${this.domainUtil.apiUrl}/data/private/v4/csv/${period}/${reportCode}`, req, {
      params: params,
      observe: 'response',
      responseType: 'text'
    });
  }

  downloadReportWithProgress(
    period: Period,
    reportCode: ReportV4SupportedCode,
    req: GetReportV4Payload,
    cred: { orgUuid; sessionToken }
  ) {
    const params = new HttpParams()
      .set(X_B3_HEADER.sessionToken, cred.sessionToken)
      .set(X_B3_HEADER.orgUuid, cred.orgUuid);

    return this.http.post(`${this.domainUtil.apiUrl}/data/private/v4/csv/${period}/${reportCode}`, req, {
      params: params,
      reportProgress: true,
      observe: 'events',
      responseType: 'blob'
    });
  }

  getArchiveTxn<ArchiveTxnResp>(body: ArchiveTxnPayload, pageable?: Pageable) {
    const params = new HttpParams()
      .set('page', pageable?.page > 0 ? String(pageable.page) : '1')
      .set('perPage', pageable?.perPage > 0 ? String(pageable.perPage) : '10');

    return this.http.post<ArchiveTxnResp[]>('data/private/v4/raw/dump/raw.chat.ended', body, { params: params });
  }
}
