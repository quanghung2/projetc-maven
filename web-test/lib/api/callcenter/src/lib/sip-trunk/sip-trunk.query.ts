import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { SipTrunkState, SipTrunkStore } from './sip-trunk.store';

@Injectable({ providedIn: 'root' })
export class SipTrunkQuery extends QueryEntity<SipTrunkState> {
  availableCallerIds$ = this.select('availableCallerIds');
  isdnCallerIds$ = this.select('isdnCallerIds');

  constructor(protected override store: SipTrunkStore) {
    super(store);
  }
}
