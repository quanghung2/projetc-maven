import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Channel, User, UserStatus } from '@b3networks/api/workspace';
import { AppService, InfoShowMention, InviteMemberComponent } from '@b3networks/chat/shared/core';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-conversation-members',
  templateUrl: './conversation-members.component.html',
  styleUrls: ['./conversation-members.component.scss']
})
export class ConversationMembersComponent {
  readonly UserStatus = UserStatus;

  @Input() members: User[] = [];
  @Input() convo: Channel;

  constructor(public dialog: MatDialog, private toastService: ToastService, private appService: AppService) {}

  inviteMember() {
    if (this.convo.isMember) {
      this.dialog.open(InviteMemberComponent, {
        width: '600px',
        data: this.convo
      });
    } else {
      this.toastService.error('You have no permission to do this');
    }
  }

  onShowProfile(event, member: User) {
    event.stopPropagation();
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
