import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { createMe, Me } from './me.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'license_me' })
export class MeStore extends Store<Me> {
  constructor() {
    super(createMe({ features: null }));
  }
}
