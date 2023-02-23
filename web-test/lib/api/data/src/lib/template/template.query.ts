import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { TemplateState, TemplateStore } from './template.store';

@Injectable({ providedIn: 'root' })
export class TemplateQuery extends QueryEntity<TemplateState> {
  templates$ = this.selectAll();

  constructor(protected override store: TemplateStore) {
    super(store);
  }
}
