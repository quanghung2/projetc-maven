import { Injectable } from '@angular/core';
import { Order, QueryEntity } from '@datorama/akita';
import { WidgetState, WidgetStore } from './widget.store';

@Injectable({ providedIn: 'root' })
export class WidgetQuery extends QueryEntity<WidgetState> {
  constructor(protected override store: WidgetStore) {
    super(store);
  }

  selectWidgetByInbox(inboxUuid: string) {
    return this.selectAll({
      filterBy: entity => entity.inboxUuid === inboxUuid,
      sortBy: 'createdAt',
      sortByOrder: Order.DESC
    });
  }
}
