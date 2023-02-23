import { Injectable } from '@angular/core';
import { Query } from '@datorama/akita';
import { User } from './user.model';
import { UserStore } from './user.store';

@Injectable({ providedIn: 'root' })
export class UserQuery extends Query<User> {
  constructor(protected override store: UserStore) {
    super(store);
  }
}
