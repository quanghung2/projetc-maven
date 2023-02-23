import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { createGeoCountry, GeoCountryResponse } from './geo';

@Injectable({ providedIn: 'root' })
@StoreConfig({
  name: 'auth_geo',
  idKey: 'uuid',
  cache: {
    ttl: 3600000 * 12
  }
})
export class GeoStore extends Store<GeoCountryResponse> {
  constructor() {
    super(createGeoCountry({}));
  }
}
