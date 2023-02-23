import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { IdentityCallerId } from './identity-callerid.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callerid-verificatiton_identity-callerid' })
export class IdentityCallerIdStore extends Store<IdentityCallerId> {
  constructor() {
    super({ number: undefined });
  }
}
