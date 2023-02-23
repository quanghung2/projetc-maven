import { Pipe, PipeTransform } from '@angular/core';
import { TypingState, UserQuery } from '@b3networks/api/workspace';
import { UNKNOWN_USER } from '../constant/common.const';

@Pipe({
  name: 'userTyping'
})
export class UserTypingPipe implements PipeTransform {
  constructor(private userQuery: UserQuery) {}

  transform(userTypings: TypingState[]) {
    if (!userTypings) {
      return '';
    }
    if (userTypings?.length === 0) {
      return '';
    } else if (userTypings?.length === 1) {
      const user = this.userQuery.getUserByChatUuid(userTypings[0].userUuid);
      return user ? user.displayName : UNKNOWN_USER;
    } else if (userTypings?.length === 2) {
      const user0 = this.userQuery.getUserByChatUuid(userTypings[0].userUuid);
      const name0 = user0 ? user0.displayName : UNKNOWN_USER;
      const user1 = this.userQuery.getUserByChatUuid(userTypings[1].userUuid);
      const name1 = user1 ? user1.displayName : UNKNOWN_USER;
      const arr = [name0, name1].sort();
      return `${arr[0]} and ${arr[1]}`;
    } else {
      return 'several users';
    }
  }
}
