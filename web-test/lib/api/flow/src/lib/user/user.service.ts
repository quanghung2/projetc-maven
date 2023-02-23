import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { User } from './user.model';
import { UserStore } from './user.store';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient, private store: UserStore) {}

  getLimitResource(): Observable<User> {
    return this.http.get<User>(`/flow/private/app/v1/user`).pipe(tap(data => this.store.update(data)));
  }
}
