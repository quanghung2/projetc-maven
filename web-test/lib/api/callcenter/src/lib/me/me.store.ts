import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Me } from './me.model';

export interface MeState {
  me: Me;
  isPermission: boolean; // isexist extension of user
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'callcenter_me', idKey: 'identityUuid' })
export class MeStore extends Store<MeState> {
  constructor() {
    super({});
  }
}
