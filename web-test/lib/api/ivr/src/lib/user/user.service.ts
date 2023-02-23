import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { User } from './user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private user: User;

  constructor(private http: HttpClient) {}

  public fetchUser(): Observable<User> {
    if (this.user) {
      return of(this.user);
    }
    return this.http.get<User>(`workflow/private/v1/me`).pipe(
      map(user => {
        this.user = new User(user);
        return this.user;
      })
    );
  }
}
