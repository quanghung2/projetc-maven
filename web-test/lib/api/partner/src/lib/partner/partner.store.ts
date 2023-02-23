import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { Partner } from './partner.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'auth_partner' })
export class PartnerStore extends Store<Partner> {
  constructor() {
    super(new Partner({}));
  }
}
