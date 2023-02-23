import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Template } from './template-message.model';

export interface TemplateMessageState extends EntityState<Template> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'whatsapp_template' })
export class TemplateMessageStore extends EntityStore<TemplateMessageState> {
  constructor() {
    super();
  }
}
