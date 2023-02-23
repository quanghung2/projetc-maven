import { Injectable, Injector } from '@angular/core';
import { Subject } from 'rxjs';
import { User } from '../model';
import { BackendService } from './backend.service';

declare var X: any;
const USER_PATH = '/private/v2/users';

@Injectable()
export class UserService {
  private subscriber: Subject<User> = new Subject<User>();
  private currentUser: User = new User();

  constructor(private injector: Injector) {
    // let user = UserService.parseUser(this.cookieParam);
    // this.setCurrentUser(user);
    // this.getProfile();
  }

  subscribe(func: any) {
    this.subscriber.subscribe(func);
    if (this.currentUser.uuid != undefined) {
      this.subscriber.next(this.currentUser);
    }
  }

  getCurrentUser(): User {
    return this.currentUser;
  }

  setCurrentUser(user) {
    this.currentUser.update(user);
    this.subscriber.next(this.currentUser);
  }

  setCurrentUserV2(user) {
    this.currentUser = user;
  }

  getProfile(): Promise<any> {
    if (this.currentUser.domain) {
      return Promise.resolve(this.currentUser);
    }
    return this.injector
      .get(BackendService)
      .get(USER_PATH + '/profile')
      .then((user: any) => {
        this.setCurrentUser(user);
      });
  }

  getProfileV2() {
    if (this.currentUser.domain) {
      return Promise.resolve(this.currentUser);
    }

    return this.injector.get(BackendService).get(USER_PATH + '/profile');
  }

  /*static parseUser(cookieParam) {
    // console.log(WINDOW_LOCATION_SEARCH);
    let injector = ReflectiveInjector.resolveAndCreate([CookieService]);
    let currentUser: User = new User();
    currentUser.update({
      orgUuid: X.getContext().orgUuid,
      sessionToken: X.getContext().sessionToken
    });
    return currentUser;
  }*/
}
