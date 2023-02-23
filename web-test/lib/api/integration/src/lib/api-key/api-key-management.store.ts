import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { APIKey } from './api-key-management.model';

export interface ApiKeyState {
  apiKey: APIKey;
}

export function createInitialState(): ApiKeyState {
  return { apiKey: null } as ApiKeyState;
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'api_key_management' })
export class ApiKeyStore extends Store<ApiKeyState> {
  constructor() {
    super(createInitialState());
  }
}
