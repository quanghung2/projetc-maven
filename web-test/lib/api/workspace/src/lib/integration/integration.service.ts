import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, tap } from 'rxjs/operators';
import { Integration } from './integration.model';
import { IntegrationState, IntegrationStore } from './integration.store';

@Injectable({ providedIn: 'root' })
export class IntegrationService {
  constructor(private store: IntegrationStore, private http: HttpClient) {}

  get() {
    return this.http.get<Integration[]>('/workspace/private/v1/integrations').pipe(
      map(entities => entities.map(i => new Integration(i))),
      tap(entities => {
        this.store.set(entities);
      })
    );
  }

  updateStateStore(data: Partial<IntegrationState>) {
    this.store.update(data);
  }
}
