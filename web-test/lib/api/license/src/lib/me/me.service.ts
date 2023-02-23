import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';
import { Me } from './me.model';
import { MeStore } from './me.store';

@Injectable({ providedIn: 'root' })
export class MeService {
  constructor(private meStore: MeStore, private http: HttpClient) {}

  getFeatures() {
    return this.http.get<string[]>(`license/private/v1/me/features`).pipe(
      tap(features => {
        this.meStore.update(<Me>{ features: features || [] });
      })
    );
  }
}
