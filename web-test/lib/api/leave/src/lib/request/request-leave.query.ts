import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { RequestLeaveState, RequestLeaveStore } from './request-leave.store';

@Injectable({ providedIn: 'root' })
export class RequestLeaveQuery extends QueryEntity<RequestLeaveState> {
  constructor(protected override store: RequestLeaveStore) {
    super(store);
  }
}
