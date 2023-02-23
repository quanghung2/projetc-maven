import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Partner } from '../partner/partner.model';

export interface PartnersState extends EntityState<Partner> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_partners', idKey: 'partnerUuid' })
export class PartnersStore extends EntityStore<PartnersState, Partner> {
  constructor() {
    super({});
  }
}
