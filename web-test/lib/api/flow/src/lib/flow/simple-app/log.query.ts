import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { StoreLogs } from '../execution-logs/execution-logs.model';
import { LogStore } from './log.store';

@Injectable({ providedIn: 'root' })
export class LogQuery extends Query<StoreLogs> {
  constructor(protected override store: LogStore) {
    super(store);
  }
}
