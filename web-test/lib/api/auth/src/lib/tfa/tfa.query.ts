import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { TfaInfo } from './tfa';
import { TfaInfoStore } from './tfa.store';

@Injectable({ providedIn: 'root' })
export class TfaInfoQuery extends Query<TfaInfo> {
  tfaInfo$ = this.select();

  constructor(protected override store: TfaInfoStore) {
    super(store);
  }
}
