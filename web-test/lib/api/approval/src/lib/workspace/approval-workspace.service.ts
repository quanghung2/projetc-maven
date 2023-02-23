import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { IntegrationTypeResponse, SubmitFormRequest } from './approval-workspace.model';

@Injectable({
  providedIn: 'root'
})
export class ApprovalWorkspaceService {
  constructor(private http: HttpClient) {}

  start() {
    return this.http.post(`approval/private/v1/workspace/requester/start`, {});
  }

  submitFormComponent(url: string, req: SubmitFormRequest) {
    return this.http.post(url, req);
  }

  checkBot(chatUserId: string) {
    const params = new HttpParams().append('botId', chatUserId);
    return this.http.get<IntegrationTypeResponse>(`approval/private/v1/workspace/requester/bot`, { params: params });
  }
}
