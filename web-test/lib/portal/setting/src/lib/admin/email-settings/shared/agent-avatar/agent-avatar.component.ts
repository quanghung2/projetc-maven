import { Component, Input } from '@angular/core';
import { User } from '@b3networks/api/workspace';

@Component({
  selector: 'b3n-email-agent-avatar',
  templateUrl: './agent-avatar.component.html',
  styleUrls: ['./agent-avatar.component.scss']
})
export class AgentAvatarComponent {
  @Input() agent: User = new User();
  @Input() set user(user: User) {
    this.agent.identityUuid = user.identityUuid;
    this.agent.photoUrl = user.photoUrl;
    this.agent.displayName = user.displayName;
  }
}
