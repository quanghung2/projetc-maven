import { Injectable } from '@angular/core';
import { SipGateway } from './sip-gateway.model';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';

export interface SipGatewayState extends EntityState<SipGateway> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'sip-gateway' })
export class SipGatewayStore extends EntityStore<SipGatewayState> {
  constructor() {
    super();
  }
}
