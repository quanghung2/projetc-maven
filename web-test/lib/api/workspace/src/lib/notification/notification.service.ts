import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CHAT_PUBLIC_PREFIX } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { NotificationMode, NotificationSettings } from './notification.model';
import { NotificationStore } from './notification.store';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  constructor(private httpClient: HttpClient, private store: NotificationStore) {}

  getSettings(): Observable<NotificationSettings> {
    this.store.setLoading(true);
    return this.httpClient.get<NotificationSettings>(`${CHAT_PUBLIC_PREFIX}/settings`).pipe(
      tap(settings => {
        this.store.update(settings);
        this.store.setLoading(false);
      })
    );
  }

  updateSettings(settings: NotificationSettings): Observable<NotificationSettings> {
    return this.httpClient.post<NotificationSettings>(`${CHAT_PUBLIC_PREFIX}/settings`, settings).pipe(
      tap(() => {
        this.store.update(settings);
      })
    );
  }

  changeNotification(mode: NotificationMode) {
    this.store.update(state => ({ ...state, notification_setting: mode }));
  }
}
