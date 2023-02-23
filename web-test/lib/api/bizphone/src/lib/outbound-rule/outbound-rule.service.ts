import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { DialPlan, OutboundRule, StatusResp, UpdateOutboundRuleResp } from './model/outbound-rule';
import { MasterDialPlan } from './model/masterdialplan';

@Injectable({
  providedIn: 'root'
})
export class OutboundRuleService {
  constructor(private http: HttpClient) {}

  getOutboundRules(): Observable<OutboundRule[]> {
    return this.http
      .get<OutboundRule[]>(`extension/private/outgoingcallrule`)
      .pipe(map(list => list.map(permission => new OutboundRule(permission))));
  }

  getOutboundRuleById(id: string): Observable<OutboundRule> {
    return this.http.get<OutboundRule>(`extension/private/outgoingcallrule/${id}`);
  }

  createOutboundRule(rule: OutboundRule): Observable<OutboundRule> {
    return this.http
      .post<OutboundRule>(`extension/private/outgoingcallrule`, rule)
      .pipe(map(res => new OutboundRule(res)));
  }

  updateOutboundRule(name: string, id: number): Observable<UpdateOutboundRuleResp> {
    const body = {
      name: name
    };
    return this.http.put<UpdateOutboundRuleResp>(`extension/private/outgoingcallrule/${id}/name`, body);
  }

  deleteOutboundRule(id: number): Observable<StatusResp> {
    return this.http.delete<StatusResp>(`extension/private/outgoingcallrule/${id}`);
  }

  addCountryWhiteList(outboundRuleId: number, allowedCountries: string[]): Observable<string[]> {
    return this.http.put<string[]>(
      `extension/private/outgoingcallrule/${outboundRuleId}/countrywhitelist/ `,
      allowedCountries
    );
  }

  removeAllCountryWhitelist(outboundRuleId: number): Observable<StatusResp> {
    return this.http.delete<StatusResp>(`extension/private/outgoingcallrule/${outboundRuleId}/countrywhitelist/ `);
  }

  removeCountryFromWhiteList(outboundRuleId, countryId: string): Observable<OutboundRule> {
    return this.http.delete<OutboundRule>(
      `extension/private/outgoingcallrule/${outboundRuleId}/countrywhitelist/${countryId}`
    );
  }

  getDialPlans(): Observable<MasterDialPlan[]> {
    return this.http
      .get<MasterDialPlan[]>(`extension/private/masterdialplan`)
      .pipe(map(list => list.map(res => new MasterDialPlan(res))));
  }

  importDialPlan(dialPlan: DialPlan): Observable<DialPlan> {
    return this.http.post<DialPlan>(`extension/private/dialplan`, dialPlan);
  }

  removeDialPlan(planId): Observable<StatusResp> {
    return this.http.delete<StatusResp>(`extension/private/dialplan/${planId}`);
  }
}
