import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { ApiKeyState, ApiKeyStore } from './api-key-management.store';

@Injectable({ providedIn: 'root' })
export class ApiKeyQuery extends Query<ApiKeyState> {
  constructor(protected override store: ApiKeyStore) {
    super(store);
  }
}
