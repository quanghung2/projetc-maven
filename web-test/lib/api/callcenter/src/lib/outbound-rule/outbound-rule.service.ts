import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DialPlanV3,
  MasterDialPlan,
  OrgLinkConfig,
  OutboundRule,
  StatusResp,
  UpdateOutboundRuleResp
} from './outbound-rule.model';

@Injectable({
  providedIn: 'root'
})
export class OutboundRuleService {
  constructor(private http: HttpClient) {}

  createOutboundRule(rule: OutboundRule): Observable<OutboundRule> {
    return this.http
      .post<OutboundRule>(`callcenter/private/v3/outgoingCallRule`, rule)
      .pipe(map(res => new OutboundRule(res)));
  }

  deleteOutboundRule(id: number): Observable<StatusResp> {
    return this.http.delete<StatusResp>(`callcenter/private/v3/outgoingCallRule/${id}`);
  }

  updateOutboundRule(id: number, outbountRule: UpdateOutboundRuleResp): Observable<UpdateOutboundRuleResp> {
    return this.http.put<UpdateOutboundRuleResp>(`callcenter/private/v3/outgoingCallRule/${id}`, outbountRule);
  }

  getOutboundRules(): Observable<OutboundRule[]> {
    return this.http
      .get<OutboundRule[]>(`callcenter/private/v3/outgoingCallRule/_all`)
      .pipe(map(list => list.map(permission => new OutboundRule(permission))));
  }

  getOutboundRuleById(id: number): Observable<OutboundRule> {
    return this.http
      .get<OutboundRule>(`callcenter/private/v3/outgoingCallRule/${id}`)
      .pipe(map(rule => new OutboundRule(rule)));
  }

  getDialPlans(ocrId: number): Observable<DialPlanV3[]> {
    return this.http
      .get<DialPlanV3[]>(`callcenter/private/v3/outgoingCallRule/${ocrId}/dialPlan/_all`)
      .pipe(map(list => list.map(res => new DialPlanV3(res))));
  }

  getDefaultOutboundRule(): Observable<OutboundRule> {
    return this.http
      .get<OutboundRule>(`callcenter/private/v3/outgoingCallRule/domain`)
      .pipe(map(res => new OutboundRule(res)));
  }

  getDefaultOrgOutboundRule(): Observable<OutboundRule> {
    return this.http
      .get<OutboundRule>(`callcenter/private/v3/outgoingCallRule/org`)
      .pipe(map(res => new OutboundRule(res)));
  }

  importDialPlan(dialPlan: DialPlanV3): Observable<DialPlanV3> {
    if (!!dialPlan?.id) {
      return this.http.put<DialPlanV3>(
        `callcenter/private/v3/outgoingCallRule/${dialPlan.outGoingCallRuleId}/dialPlan/${dialPlan?.id}`,
        dialPlan
      );
    } else {
      return this.http.post<DialPlanV3>(
        `callcenter/private/v3/outgoingCallRule/${dialPlan.outGoingCallRuleId}/dialPlan`,
        dialPlan
      );
    }
  }

  removeDialPlan(dialPlan: DialPlanV3): Observable<void> {
    return this.http.delete<void>(
      `callcenter/private/v3/outgoingCallRule/${dialPlan.outGoingCallRuleId}/dialPlan/${dialPlan?.id}`
    );
  }

  getDialPlansDefault() {
    return this.http
      .get<MasterDialPlan[]>(`callcenter/private/v3/masterDialPlan`)
      .pipe(map(list => list.map(res => new MasterDialPlan(res))));
  }

  addOrgLinkConfig(outGoingCallRuleId: number, body: OrgLinkConfig) {
    return this.http.post<OrgLinkConfig>(`callcenter/private/v3/outgoingCallRule/${outGoingCallRuleId}/orgLink`, body);
  }

  delOrgLinkConfig(ocrId: number, targetOrgUuid: string) {
    return this.http.delete(`callcenter/private/v3/outgoingCallRule/${ocrId}/orgLink?targetOrgUuid=${targetOrgUuid}`);
  }
}
