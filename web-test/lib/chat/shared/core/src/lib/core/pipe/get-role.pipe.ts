import { Pipe, PipeTransform } from '@angular/core';
import { Channel, RoleType, User, UserQuery } from '@b3networks/api/workspace';
import { of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SupportedConvo } from './../adapter/convo-helper.service';

@Pipe({
  name: 'getRole'
})
export class GetRolePipe implements PipeTransform {
  constructor(private userQuery: UserQuery) {}

  transform(user: User, channel: SupportedConvo) {
    if (!user || !channel) {
      return of(null);
    }

    if (!(channel instanceof Channel)) {
      return null;
    }

    return this.userQuery.selectUserByChatUuid(user.userUuid).pipe(
      filter(x => x != null),
      map(member => {
        if (channel.createdBy === member.userUuid) {
          return RoleType.owner;
        } else if (channel?.participants?.some(p => p.userID === user.userUuid)) {
          return RoleType.member;
        }
        return RoleType.guest;
      })
    );
  }
}
