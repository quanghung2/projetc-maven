import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChannelHyperspace, Hyperspace, UserHyperspace } from '@b3networks/api/workspace';
import { uniq } from 'lodash';

@Component({
  selector: 'b3n-confirm-invite-hyperspace',
  templateUrl: './confirm-invite-hyperspace.component.html',
  styleUrls: ['./confirm-invite-hyperspace.component.scss']
})
export class ConfirmInviteHyperspaceComponent implements OnInit {
  msg: string;
  users: UserHyperspace[];
  ctaButton: string;
  processing: boolean;

  constructor(
    public dialogRef: MatDialogRef<ConfirmInviteHyperspaceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InputConfirmInviteHyperspaceDialog
  ) {
    this.users = uniq(data.members).map(chatUuid => this.data.hyperspace.allMembers.find(x => x.userUuid === chatUuid));
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

export interface InputConfirmInviteHyperspaceDialog {
  members: string[];
  convo: ChannelHyperspace;
  hyperspace: Hyperspace;
}
