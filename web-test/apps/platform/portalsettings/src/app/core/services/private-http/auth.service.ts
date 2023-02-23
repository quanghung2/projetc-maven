import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AsyncSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PrivateHttpService } from '../private-http.service';
import { Country } from './../../models/country.model';

@Injectable({ providedIn: 'root' })
export class AuthService extends PrivateHttpService {
  private getCountriesSubject: AsyncSubject<Array<Country>>;

  constructor(private httpClient: HttpClient) {
    super();
  }

  getCountries(): Observable<Array<Country>> {
    if (!this.getCountriesSubject) {
      this.getCountriesSubject = new AsyncSubject();
    }
    this.httpClient
      .get<any>(this.constructFinalEndpoint('/auth/private/v1/countries'))
      .pipe(map((res: Array<any>) => res.map(o => new Country(o))))
      .subscribe(
        res => {
          this.getCountriesSubject.next(res);
          this.getCountriesSubject.complete();
        },
        err => {
          this.getCountriesSubject.error(err);
        }
      );
    return this.getCountriesSubject;
  }
}
