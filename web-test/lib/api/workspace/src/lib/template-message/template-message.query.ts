import { Injectable } from '@angular/core';
import { QueryEntity } from '@datorama/akita';
import { TemplateMessageState, TemplateMessageStore } from './template-message.store';

@Injectable({ providedIn: 'root' })
export class TemplateMessageQuery extends QueryEntity<TemplateMessageState> {
  templates$ = this.selectAll();
  isLoading$ = this.selectLoading();

  constructor(protected override store: TemplateMessageStore) {
    super(store);
  }
}
