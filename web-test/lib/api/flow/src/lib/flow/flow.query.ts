import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { Flow } from './flow.model';
import { FlowStore } from './flow.store';

@Injectable({ providedIn: 'root' })
export class FlowQuery extends Query<Flow> {
  constructor(protected override store: FlowStore) {
    super(store);
  }
}
