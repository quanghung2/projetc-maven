import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MissedCallFlow } from './missed-call-flows.model';

@Injectable({
  providedIn: 'root'
})
export class MissedCallFlowService {
  constructor(private http: HttpClient) {}

  getMissedCallFlows(): Observable<MissedCallFlow[]> {
    return this.http.get<MissedCallFlow[]>(`intelligence-gateway/connector/voice/private/v1/get-missed-call-flows`);
  }
}
