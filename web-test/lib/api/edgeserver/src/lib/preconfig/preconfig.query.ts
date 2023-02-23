import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { PreConfig } from './preconfig.model';
import { PreConfigStore } from './preconfig.store';

@Injectable({ providedIn: 'root' })
export class PreConfigQuery extends Query<PreConfig> {
  constructor(protected override store: PreConfigStore) {
    super(store);
  }
}
