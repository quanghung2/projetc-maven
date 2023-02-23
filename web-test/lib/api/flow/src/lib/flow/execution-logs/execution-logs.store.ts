import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { StoreLogs } from './execution-logs.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_logs', resettable: true })
export class ExecutionLogsStore extends Store<StoreLogs> {
  constructor() {
    super(new StoreLogs());
  }
}
