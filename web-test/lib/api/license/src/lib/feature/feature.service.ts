import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { FeatureStore } from './feature.store';

@Injectable({ providedIn: 'root' })
export class FeatureService {
  constructor(private http: HttpClient, private store: FeatureStore) {}

  /**
   *  Get org's license features
   * @returns list of feature code subscribed by org
   */
  get() {
    return this.http.get<string[]>('license/private/v1/features').pipe(
      // map(_ => [LicenseFeatureCode.license_smpp]), // mock for testing only
      tap(data => this.store.update({ licenses: data }))
    );
  }
}
