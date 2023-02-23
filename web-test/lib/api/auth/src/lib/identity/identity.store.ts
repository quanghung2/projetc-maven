import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Identity } from './identity';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_identity' })
export class IdentityStore extends Store<Identity> {
  constructor() {
    super(new Identity());
  }
}
