import { Injectable } from '@angular/core';
import { StoreConfig, EntityStore, EntityState } from '@datorama/akita';
import { Country } from './country';

export interface CountryState extends EntityState<Country> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'auth_country',
  idKey: 'code',
  cache: {
    ttl: 3600000 * 12
  }
})
export class CountryStore extends EntityStore<CountryState> {
  constructor() {
    super();
  }
}
