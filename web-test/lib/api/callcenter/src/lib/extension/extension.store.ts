import { Injectable } from '@angular/core';
import { Extension, ExtensionBase } from '@b3networks/api/bizphone';
import { ActiveState, EntityState, EntityStore, HashMap, StoreConfig } from '@datorama/akita';
import { AllowedCallerId, DelegatedCallerId } from './allowed-callerid.model';

export interface ExtensionState extends EntityState<ExtensionBase>, ActiveState {
  me?: Extension;
  allowedCallerIds: HashMap<AllowedCallerId>; // map by extKey
  delegatedCallerIds: HashMap<DelegatedCallerId[]>;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callcenter_extension', idKey: 'extKey', cache: { ttl: 10 * 60 * 1000 } })
export class ExtensionStore extends EntityStore<ExtensionState> {
  constructor() {
    super({ allowedCallerIds: {}, delegatedCallerIds: {} });
  }
}
