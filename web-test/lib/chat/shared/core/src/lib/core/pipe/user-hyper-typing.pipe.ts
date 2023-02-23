import { Pipe, PipeTransform } from '@angular/core';
import { HyperspaceQuery, TypingState } from '@b3networks/api/workspace';
import { UNKNOWN_USER } from '../constant/common.const';

@Pipe({
  name: 'userHyperTyping'
})
export class UserHyperTypingPipe implements PipeTransform {
  constructor(private hyperspaceQuery: HyperspaceQuery) {}

  transform(userTypings: TypingState[], hsId: string) {
    const hyper = this.hyperspaceQuery.getEntity(hsId);
    if (!userTypings || !hyper) {
      return '';
    }
    if (userTypings?.length === 0) {
      return '';
    } else if (userTypings?.length === 1) {
      const user = hyper?.allMembers.find(x => x.userUuid === userTypings[0].userUuid);
      return user ? user.displayName : UNKNOWN_USER;
    } else if (userTypings?.length === 2) {
      const user0 = hyper?.allMembers.find(x => x.userUuid === userTypings[0].userUuid);
      const name0 = user0 ? user0.displayName : UNKNOWN_USER;
      const user1 = hyper?.allMembers.find(x => x.userUuid === userTypings[1].userUuid);
      const name1 = user1 ? user1.displayName : UNKNOWN_USER;
      const arr = [name0, name1].sort();
      return `${arr[0]} and ${arr[1]}`;
    } else {
      return 'several users';
    }
  }
}
