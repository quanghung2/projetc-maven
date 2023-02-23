import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { cacheable } from '@datorama/akita';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GeoCountryResponse } from './geo';
import { GeoStore } from './geo.store';

@Injectable({
  providedIn: 'root'
})
export class GeoService {
  constructor(private http: HttpClient, private geoStore: GeoStore) {}

  getGeoInfo(addons?: { forceLoad: boolean }): Observable<GeoCountryResponse> {
    const request$ = this.http.get<GeoCountryResponse>('/auth/private/v1/geoip').pipe(
      map(res => {
        const temp = Object.assign(new GeoCountryResponse(), res);
        this.geoStore.update(temp);
        this.geoStore.setHasCache(true);
        return temp;
      })
    );

    if (addons?.forceLoad) {
      return request$;
    }

    return cacheable(this.geoStore, request$);
  }
}
