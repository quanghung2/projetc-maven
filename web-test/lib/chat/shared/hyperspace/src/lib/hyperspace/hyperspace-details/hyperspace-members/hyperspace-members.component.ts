import { Component, Input } from '@angular/core';
import { ChannelHyperspace, Hyperspace, UserHyperspace, UserStatus } from '@b3networks/api/workspace';
import { AppService, InfoShowMention } from '@b3networks/chat/shared/core';

@Component({
  selector: 'b3n-hyperspace-members',
  templateUrl: './hyperspace-members.component.html',
  styleUrls: ['./hyperspace-members.component.scss']
})
export class HyperspaceMembersComponent {
  readonly UserStatus = UserStatus;

  @Input() members: UserHyperspace[] = [];
  @Input() convo: ChannelHyperspace;
  @Input() hyper: Hyperspace;

  constructor(private appService: AppService) {}

  onShowProfile(event, member: UserHyperspace) {
    if (member instanceof UserHyperspace) event.stopPropagation();
    this.appService.update({
      memberMenu: <InfoShowMention>{
        xPosition: event.x,
        yPosition: event.y,
        member: member,
        convo: this.convo
      }
    });
  }
}
