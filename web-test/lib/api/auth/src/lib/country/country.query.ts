import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { CountryState, CountryStore } from './country.store';

@Injectable({ providedIn: 'root' })
export class CountryQuery extends QueryEntity<CountryState> {
  country$ = this.selectAll();
  countries$ = this.selectAll();

  constructor(protected override store: CountryStore) {
    super(store);
  }
}
