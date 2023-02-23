import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { StoreLogs } from '../execution-logs/execution-logs.model';

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'flow_log', resettable: true })
export class LogStore extends Store<StoreLogs> {
  constructor() {
    super(new StoreLogs());
  }
}
