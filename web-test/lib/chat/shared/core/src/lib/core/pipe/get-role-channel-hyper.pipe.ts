import { Pipe, PipeTransform } from '@angular/core';
import { ChannelHyperspace, RoleType, User, UserHyperspace } from '@b3networks/api/workspace';
import { SupportedConvo } from './../adapter/convo-helper.service';

@Pipe({
  name: 'getRoleChannelHyper'
})
export class GetRoleChannelHyperPipe implements PipeTransform {
  constructor() {}

  transform(user: UserHyperspace | User, channel: SupportedConvo) {
    if (!user || !channel) {
      return null;
    }

    if (!(channel instanceof ChannelHyperspace)) {
      return null;
    }

    // TODO : fix owner ns+chatUser
    if (channel.createdBy === user.userUuid) {
      return RoleType.owner;
    } else if (channel?.allMembers?.some(p => p.userID === user.userUuid)) {
      return RoleType.member;
    }
    return RoleType.guest;
  }
}
