import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { X_B3_HEADER } from '@b3networks/shared/common';
import { FeedbackInfoReq } from './feedback-info-req';

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  constructor(private http: HttpClient) {}

  getTxnInfo(txnUuid: string, orgUuid: string) {
    let headers = new HttpHeaders();

    if (orgUuid) {
      headers = headers.set(X_B3_HEADER.orgUuid, orgUuid);
    }

    return this.http.get(`callcenter/public/v1/feedbacks/${txnUuid}`, {
      headers: headers
    });
  }

  sendFeedback(txnUuid: string, body: FeedbackInfoReq, orgUuid: string) {
    let headers = new HttpHeaders();

    if (orgUuid) {
      headers = headers.set(X_B3_HEADER.orgUuid, orgUuid);
    }

    return this.http.post(`callcenter/public/v1/feedbacks/${txnUuid}`, body, {
      headers: headers
    });
  }
}
