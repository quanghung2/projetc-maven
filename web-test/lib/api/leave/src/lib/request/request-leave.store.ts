import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { RequestLeave } from './request-leave.model';

export interface RequestLeaveState extends EntityState<RequestLeave> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'Leave_reuqest', idKey: 'identityUuid' })
export class RequestLeaveStore extends EntityStore<RequestLeaveState> {
  constructor() {
    super();
  }
}
