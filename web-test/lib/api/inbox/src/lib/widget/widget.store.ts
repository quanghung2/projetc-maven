import { Injectable } from '@angular/core';
import { EntityState, EntityStore, StoreConfig } from '@datorama/akita';
import { Widget } from './widget.model';

export interface WidgetState extends EntityState<Widget> {}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'inbox-widget', idKey: 'uuid' })
export class WidgetStore extends EntityStore<WidgetState> {
  constructor() {
    super();
  }
}
