import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CreateOrUpdateInboundRuleReq, InboundRule } from './inbound-rule.model';

@Injectable({
  providedIn: 'root'
})
export class InboundRuleService {
  constructor(private http: HttpClient) {}

  getInboundRules(): Observable<InboundRule[]> {
    return this.http
      .get<InboundRule[]>(`callcenter/private/v3/incomingCallRules`)
      .pipe(map(list => list.map(rule => new InboundRule(rule))));
  }

  getOne(id): Observable<InboundRule> {
    return this.http.get<InboundRule>(`callcenter/private/v3/incomingCallRules/${id}`);
  }

  getDefaultInboundRule(): Observable<InboundRule> {
    return this.http.get<InboundRule>(`callcenter/private/v3/incomingCallRules/domain`);
  }

  getDefaultOrgInboundRule(): Observable<InboundRule> {
    return this.http.get<InboundRule>(`callcenter/private/v3/incomingCallRules/org`);
  }

  create(req: CreateOrUpdateInboundRuleReq): Observable<InboundRule> {
    return this.http.post<InboundRule>(`callcenter/private/v3/incomingCallRules`, req);
  }

  update(id: number, req: CreateOrUpdateInboundRuleReq) {
    return this.http.put(`callcenter/private/v3/incomingCallRules/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`callcenter/private/v3/incomingCallRules/${id}`);
  }
}
