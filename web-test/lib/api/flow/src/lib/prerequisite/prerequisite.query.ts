import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { InvalidConnector, PrerequisiteStore } from './prerequisite.store';

@Injectable({ providedIn: 'root' })
export class PrerequisiteQuery extends Query<InvalidConnector> {
  constructor(protected override store: PrerequisiteStore) {
    super(store);
  }
}
