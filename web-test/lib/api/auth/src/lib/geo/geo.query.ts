import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { GeoCountryResponse } from './geo';
import { GeoStore } from './geo.store';

@Injectable({ providedIn: 'root' })
export class GeoQuery extends Query<GeoCountryResponse> {
  geo$ = this.select();

  constructor(protected override store: GeoStore) {
    super(store);
  }

  get geo() {
    return this.getValue();
  }
}
