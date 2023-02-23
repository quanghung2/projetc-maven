import { Injectable } from '@angular/core';
import { ActiveState, EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { SipAccount } from './sip-trunk.model';

export interface SipTrunkState extends EntityState<SipAccount>, ActiveState {
  availableCallerIds: string[];
  isdnCallerIds: string[];
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callcenter_sip-trunk', idKey: 'sipUsername' })
export class SipTrunkStore extends EntityStore<SipTrunkState> {
  constructor() {
    super({
      availableCallerIds: [],
      isdnCallerIds: []
    });
  }
}
