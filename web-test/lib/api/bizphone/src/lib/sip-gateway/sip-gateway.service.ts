import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { ComplianceAction } from '../enums';
import { SipGateway } from './sip-gateway.model';
import { SipGatewayStore } from './sip-gateway.store';

@Injectable({ providedIn: 'root' })
export class SipGatewayService {
  constructor(private sipGatewayStore: SipGatewayStore, private http: HttpClient) {}

  get() {
    return this.http.get<SipGateway[]>('extension/private/sipgw').pipe(
      tap(entities => {
        this.sipGatewayStore.set(entities);
      })
    );
  }

  updateCompliance(sipUsername: string, body: { dnc: ComplianceAction; consent: ComplianceAction }) {
    return this.http.put<{ sip: SipGateway }>(`extension/private/dnc/${sipUsername}`, body).pipe(
      map(res => res.sip),
      tap(sip => this.sipGatewayStore.update(sipUsername, sip))
    );
  }

  updateComplicances(req: { selected: string[]; dnc: ComplianceAction; consent: ComplianceAction }) {
    return this.http.put<{ sip: SipGateway[] }>(`extension/private/dnc`, req).pipe(
      tap(res => {
        res.sip.forEach(sipgw => {
          this.sipGatewayStore.update(sipgw.sipUsername, sipgw);
        });
      })
    );
  }
}
