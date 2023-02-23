import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { IdentityCallerId } from './identity-callerid.model';
import { IdentityCallerIdStore } from './identity-callerid.store';

@Injectable({ providedIn: 'root' })
export class IdentityCallerIdQuery extends Query<IdentityCallerId> {
  constructor(protected override store: IdentityCallerIdStore) {
    super(store);
  }
}
