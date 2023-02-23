import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { NotificationSettings } from './notification.model';
import { NotificationStore } from './notification.store';

@Injectable({ providedIn: 'root' })
export class NotificationQuery extends Query<NotificationSettings> {
  constructor(protected override store: NotificationStore) {
    super(store);
  }
}
