import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Holiday } from './holiday';

@Injectable({
  providedIn: 'root'
})
export class HolidayService {
  constructor(private http: HttpClient) {}

  getSupportedHolidayContries(): Observable<string[]> {
    return this.http.get<string[]>(`leave/private/v1/ph/countries`);
  }

  fetchHolidays(countryCode: string, year: number): Observable<Holiday[]> {
    return this.http
      .get<Holiday[]>(`leave/private/ph`, {
        params: { year: String(year), countryCode: countryCode }
      })
      .pipe(map(res => res.map(ho => new Holiday(ho))));
  }
}
