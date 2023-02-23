import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { createFeatureId, FeatureCode } from './feature-code.model';
import { FeatureCodeStore } from './feature-code.store';

@Injectable({ providedIn: 'root' })
export class FeatureCodeService {
  constructor(private featureCodeStore: FeatureCodeStore, private http: HttpClient) {}

  get(orgUuid: string) {
    this.featureCodeStore.setLoading(true);
    return this.http.get<string[]>(`/portal/private/v1/features`).pipe(
      map(features =>
        features.map(code => <FeatureCode>{ id: createFeatureId(orgUuid, code), orgUuid: orgUuid, featureCode: code })
      ),
      tap(features => {
        this.featureCodeStore.update(state => {
          return { loadedOrgs: [...state.loadedOrgs, orgUuid], loading: false };
        });
        if (!this.featureCodeStore.getValue().ids.length) {
          this.featureCodeStore.set(features);
        } else {
          this.featureCodeStore.add(features);
        }
      })
    );
  }
}
