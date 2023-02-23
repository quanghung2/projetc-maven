import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { Identity } from './identity';
import { IdentityStore } from './identity.store';

@Injectable({ providedIn: 'root' })
export class IdentityQuery extends Query<Identity> {
  constructor(protected override store: IdentityStore) {
    super(store);
  }
}
