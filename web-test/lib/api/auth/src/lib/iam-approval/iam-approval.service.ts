import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApprovalResp, CreateApprovalReq } from './iam-approval.model';

@Injectable({
  providedIn: 'root'
})
export class IamApprovalService {
  constructor(private http: HttpClient) {}

  fetchAllApprovalsByOrgUuid(orgUuid: string): Observable<ApprovalResp[]> {
    const params = new HttpParams().set('orgUuid', orgUuid);
    return this.http
      .get<ApprovalResp[]>(`/auth/private/v1/iam/approvals`, { params: params })
      .pipe(map(list => list.map(res => new ApprovalResp(res))));
  }

  create(req: CreateApprovalReq): Observable<ApprovalResp> {
    return this.http.post<ApprovalResp>(`/auth/private/v1/iam/approvals`, req);
  }
}
