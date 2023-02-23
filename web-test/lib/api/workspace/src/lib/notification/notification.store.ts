import { Injectable } from '@angular/core';
import { Store, StoreConfig } from '@datorama/akita';
import { NotificationMode, NotificationSettings } from './notification.model';

export function createInitialState(): NotificationSettings {
  return {
    keywords: [],
    notification_setting: NotificationMode.default
  };
}

@Injectable({ providedIn: 'root' })
@StoreConfig({ name: 'workspace_notification' })
export class NotificationStore extends Store<NotificationSettings> {
  constructor() {
    super(createInitialState());
  }
}
