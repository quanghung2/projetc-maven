import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { PartnersState, PartnersStore } from './partners.store';

@Injectable({ providedIn: 'root' })
export class PartnersQuery extends QueryEntity<PartnersState> {
  partners$ = this.selectAll();

  constructor(protected override store: PartnersStore) {
    super(store);
  }
}
