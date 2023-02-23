import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import '@firebase/messaging';
import * as firebase from 'firebase/app';
import { Observable, Subject } from 'rxjs';
import { mergeMap, retry } from 'rxjs/operators';
import { FirebaseNotification } from './firebase-notification.model';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationService {
  currentToken?: string;
  appId?: string;

  message$: Subject<FirebaseNotification> = new Subject();

  constructor(private http: HttpClient) {}

  initializeFirebase(appId: string): Observable<any> {
    this.appId = appId;
    return this.http.get<any>(`/portal/private/v1/firebase/config`).pipe(
      mergeMap(data => {
        firebase.initializeApp(data);

        const messaging = firebase.messaging();

        messaging.onMessage(payload => {
          if (!this.appId || (payload && payload.data && payload.data.appId === this.appId)) {
            this.message$.next(payload as FirebaseNotification);
          }
        });

        return this.ask2backgroundRun(messaging);
      })
    );
  }

  async unregisterToken() {
    if (this.currentToken) {
      await this.http
        .delete<void>(`/notification/private/v1/device/unregister/webBrowser/${this.currentToken}`)
        .subscribe(_ => (this.currentToken = undefined));
    }
  }

  private ask2backgroundRun(messaging: firebase.messaging.Messaging) {
    return Observable.create((obs: { next: (arg0: boolean) => void }) => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('firebase-messaging-sw.js')
          .then(registration => {
            messaging.useServiceWorker(registration);

            // use callback to support safari
            Notification.requestPermission(() => {
              messaging
                .getToken()
                .then(currentToken => {
                  if (currentToken) {
                    this.saveToken(currentToken);
                  } else {
                    console.log('No Instance ID token available. Request permission to generate one.');
                  }
                })
                .catch(function (err) {
                  console.error('An error occurred while retrieving token. ', err);
                });

              messaging.onTokenRefresh(() => {
                messaging
                  .getToken()
                  .then(refreshedToken => {
                    this.saveToken(refreshedToken);
                  })
                  .catch(function (err) {
                    console.error('Unable to retrieve refreshed token ', err);
                  });
              });
            });

            navigator.serviceWorker.addEventListener('message', event => {
              const payload = event.data['firebase-messaging-msg-data'] || event.data;
              if (!this.appId || (payload && payload.data && payload.data.appId === this.appId)) {
                this.message$.next(payload as FirebaseNotification);
              }
            });
            obs.next(true);
          })
          .catch(function (e) {
            console.error(e);
            obs.next(false);
          });
      } else {
        console.log('Service Worker is not supported in this browser.');
        obs.next(false);
      }
    });
  }

  private saveToken(token: string) {
    if (token) {
      this.currentToken = token;
      this.http
        .post(`/notification/private/v1/device/register`, {
          device: 'webBrowser',
          deviceInfo: navigator.userAgent,
          token: token
        })
        .pipe(retry(3))
        .subscribe();
    }
  }
}
