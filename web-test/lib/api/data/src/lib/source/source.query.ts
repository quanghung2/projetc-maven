import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { SourceState, SourceStore } from './source.store';

@Injectable({ providedIn: 'root' })
export class SourceQuery extends QueryEntity<SourceState> {
  source$ = this.selectAll();

  constructor(protected override store: SourceStore) {
    super(store);
  }
}
