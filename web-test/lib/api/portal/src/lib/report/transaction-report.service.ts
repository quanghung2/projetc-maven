import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { GetTransactionReportReq, TransactionReportResp } from './transaction-report.modal';

@Injectable({
  providedIn: 'root'
})
export class TransactionReportService {
  constructor(private http: HttpClient) {}

  fetchTransactionReports(req: GetTransactionReportReq): Observable<TransactionReportResp> {
    return this.http.get<TransactionReportResp>(
      `/portal/private/v1/reports?month=${req.month}&domain=${req.domain}&type=${req.type}`
    );
  }
}
