import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { Partner } from './partner.model';
import { PartnerStore } from './partner.store';

@Injectable({ providedIn: 'root' })
export class PartnerQuery extends Query<Partner> {
  partner$ = this.select();

  constructor(protected override store: PartnerStore) {
    super(store);
  }
}
