import { Injectable } from '@angular/core';
import { NavigationExtras, Router } from '@angular/router';
import { addSeconds } from 'date-fns';
import { from, Observable, of, throwError } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Permission } from './browser-notification-permision.model';

export interface NotificationRouterLink {
  commands: any[];
  extras?: NavigationExtras;
}

@Injectable({
  providedIn: 'root'
})
export class BrowserNotificationService {
  permission?: Permission;
  latestShow: any;
  latestTimeout: any;
  defaultOptions?: NotificationOptions;

  constructor(private router: Router) {
    if (this.isSupported()) {
      this.permission = Notification.permission as Permission;
      this.defaultOptions = this.buildDefaultOptions();
    } else {
      console.log(`Browser does not support Push Notification`);
    }
  }

  requestPermission(): Observable<Permission> | undefined {
    if (this.isSupported()) {
      let ob;
      try {
        ob = from(Notification.requestPermission()).pipe(
          map(result => result as Permission),
          tap(result => (this.permission = result))
        );
      } catch (error) {
        // support old webkit (safari)
        if (error instanceof TypeError) {
          Notification.requestPermission(() => {
            this.permission = Notification.permission as Permission;
            ob = of(this.permission);
          });
        } else {
          return throwError(error);
        }
      }
      return ob;
    } else {
      return throwError({ code: 'browserNotSupportNotification', message: 'Browser does not support notification.' });
    }
  }

  sendNotify(title: string, options?: NotificationOptions, routeLink?: NotificationRouterLink) {
    options = { ...this.defaultOptions, ...options };

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return new Observable(function (obs) {
      if (!self.isSupported()) {
        console.log('Notifications are not available in this environment');
        obs.complete();
      }

      if (self.permission !== Permission.granted) {
        console.log("The user hasn't granted you permission to send push notifications");
        obs.complete();
      }

      const _notify = new Notification(title, options);
      _notify.onshow = function (e) {
        return obs.next({
          notification: _notify,
          event: e
        });
      };

      _notify.onclick = function (e) {
        console.log(`onclick`);
        if (routeLink) {
          self.router.navigate(routeLink.commands, routeLink.extras).then(value => console.log(value));
          (window?.parent || window)?.focus();
          this.close();
          console.log('navigated from click');
        }

        return obs.next({
          notification: _notify,
          event: e,
          isClicked: true
        });
      };

      _notify.onerror = function (e) {
        return obs.error({
          notification: _notify,
          event: e
        });
      };

      _notify.onclose = function () {
        return obs.complete();
      };

      self.latestShow = new Date();
      if (addSeconds(self.latestShow, 10) < new Date() && self.latestTimeout) {
        clearTimeout(self.latestTimeout);
      }

      self.latestTimeout = setTimeout(() => _notify.close(), 10010);
    });
  }

  isSupported() {
    return 'Notification' in window;
  }

  private buildDefaultOptions(): NotificationOptions {
    return <NotificationOptions>{
      // icon: `assets/favicon.ico`
    };
  }
}
