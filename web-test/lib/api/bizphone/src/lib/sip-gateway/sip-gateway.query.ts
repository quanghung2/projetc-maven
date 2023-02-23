import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { ComplianceAction } from '../enums';
import { SipGatewayState, SipGatewayStore } from './sip-gateway.store';

@Injectable({ providedIn: 'root' })
export class SipGatewayQuery extends QueryEntity<SipGatewayState> {
  sipGWsHasNotCompliance$ = this.selectAll({
    filterBy: s => s.dncAction === ComplianceAction.BYPASS && s.consentAction === ComplianceAction.BYPASS
  });

  sipGWsHasCompliance$ = this.selectAll({
    filterBy: s => s.dncAction !== ComplianceAction.BYPASS || s.consentAction !== ComplianceAction.BYPASS
  });

  constructor(protected override store: SipGatewayStore) {
    super(store);
  }

  selectSipGWsHasNotCompliances(q: string) {
    return this.selectAll({
      filterBy: s =>
        s.dncAction === ComplianceAction.BYPASS &&
        s.consentAction === ComplianceAction.BYPASS &&
        s.sipUsername.search(q) > -1
    });
  }
}
