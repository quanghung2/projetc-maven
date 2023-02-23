import { Pipe, PipeTransform } from '@angular/core';
import { RequestLeaveQuery } from '@b3networks/api/leave';
import { User, UserQuery } from '@b3networks/api/workspace';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'selectUser'
})
export class SelectUserPipe implements PipeTransform {
  constructor(private userQuery: UserQuery, private requestLeaveQuery: RequestLeaveQuery) {}

  transform(userChatUuid: string, isChatUuid = true): Observable<User> {
    if (!userChatUuid) {
      return of(<User>{
        displayName: 'Unknown user'
      });
    }
    return isChatUuid
      ? this.userQuery.selectUserByChatUuid(userChatUuid).pipe(
          map(
            u =>
              new User({ ...u, requestLeaveNow: this.requestLeaveQuery.getEntity(u?.identityUuid)?.requestLeaveNow }) ||
              <User>{
                displayName: 'Unknown user'
              }
          )
        )
      : this.userQuery.selectEntity(userChatUuid).pipe(
          map(
            u =>
              new User({ ...u, requestLeaveNow: this.requestLeaveQuery.getEntity(u?.identityUuid)?.requestLeaveNow }) ||
              <User>{
                displayName: 'Unknown user'
              }
          )
        );
  }
}
