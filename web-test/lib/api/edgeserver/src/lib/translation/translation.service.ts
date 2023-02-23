import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TestTranslationProfile, TranslationProfile } from './translation.model';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  constructor(private http: HttpClient) {}

  getTranslationProfile(cluster: string) {
    return this.http.get<TranslationProfile[]>(`/edge/private/v1/clusters/${cluster}/config/profile/translation`);
  }

  createTranslationProfile(request: TranslationProfile, cluster: string) {
    return this.http.post(`/edge/private/v1/clusters/${cluster}/config/profile/translation`, request);
  }

  updateTranslationProfile(request: TranslationProfile, cluster: string) {
    return this.http.put(`/edge/private/v1/clusters/${cluster}/config/profile/translation`, request);
  }

  deleteTranslationProfile(name: string, cluster: string) {
    return this.http.delete(`/edge/private/v1/clusters/${cluster}/config/profile/translation/${name}`);
  }

  testTranslationProfile(name: string, number: string, cluster: string): Observable<TestTranslationProfile> {
    return this.http.get<TestTranslationProfile>(
      `/edge/private/v1/clusters/${cluster}/config/profile/translation/${name}/test/${number}`
    );
  }
}
