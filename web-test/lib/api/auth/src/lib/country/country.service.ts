import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Country } from './country';
import { CountryStore } from './country.store';

@Injectable({
  providedIn: 'root'
})
export class CountryService {
  constructor(private http: HttpClient, private countryStore: CountryStore) {}

  getCountry(): Observable<Country[]> {
    const request$ = this.http.get<Country[]>('/auth/private/v1/countries').pipe(
      map((response: Country[]) => {
        return response.filter((item: Country) => item.code !== '-' && item.code !== '00');
      }),
      tap(result => this.countryStore.set(result))
    );
    return cacheable(this.countryStore, request$);
  }
}
