import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { CannedResponse } from './canned-response.model';

export interface CannedResponseState extends EntityState<CannedResponse> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_canned_response' })
export class CannedResponseStore extends EntityStore<CannedResponseState> {
  constructor() {
    super();
  }
}
