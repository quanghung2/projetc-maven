import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { TfaInfo } from './tfa';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_tfa' })
export class TfaInfoStore extends Store<TfaInfo> {
  constructor() {
    super({});
  }
}
