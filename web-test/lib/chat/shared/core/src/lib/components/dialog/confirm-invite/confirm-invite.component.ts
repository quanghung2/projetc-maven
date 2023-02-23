import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Channel, User, UserQuery } from '@b3networks/api/workspace';
import { uniq } from 'lodash';

@Component({
  selector: 'b3n-confirm-invite',
  templateUrl: './confirm-invite.component.html',
  styleUrls: ['./confirm-invite.component.scss']
})
export class ConfirmInviteComponent implements OnInit {
  msg: string;
  users: User[];
  ctaButton: string;
  processing: boolean;

  constructor(
    public dialogRef: MatDialogRef<ConfirmInviteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputConfirmInviteDialog,
    private userQuery: UserQuery
  ) {
    this.users = uniq(data.members).map(chatUuid => this.userQuery.getUserByChatUuid(chatUuid));
    this.msg = `${
      this.users.length === 1 ? "isn't a member" : "aren't members"
    }. Would you like to invite to this channel?`;
    this.ctaButton = this.users.length > 1 ? 'Invite them' : 'Invite';
  }

  ngOnInit() {}

  submit() {
    this.dialogRef.close(true);
  }
}

export interface InputConfirmInviteDialog {
  members: string[];
  convo: Channel;
}
