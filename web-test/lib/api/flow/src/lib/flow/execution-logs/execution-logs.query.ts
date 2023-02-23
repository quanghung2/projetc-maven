import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { StoreLogs } from './execution-logs.model';
import { ExecutionLogsStore } from './execution-logs.store';

@Injectable({ providedIn: 'root' })
export class ExecutionLogsQuery extends Query<StoreLogs> {
  constructor(protected override store: ExecutionLogsStore) {
    super(store);
  }
}
