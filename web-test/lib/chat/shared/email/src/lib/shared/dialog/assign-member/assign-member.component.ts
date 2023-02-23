import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ConversationGroup, ConversationGroupService, Member, RoleType } from '@b3networks/api/workspace';

@Component({
  selector: 'b3n-app-assign-member',
  templateUrl: './assign-member.component.html',
  styleUrls: ['./assign-member.component.scss']
})
export class AssignMemberDialog {
  memberIds: string[] = [];
  existingMembers: Member[] = [];

  constructor(
    private conversationGroupService: ConversationGroupService,
    private dialogRef: MatDialogRef<AssignMemberDialog>,
    @Inject(MAT_DIALOG_DATA) public channel: ConversationGroup
  ) {
    this.existingMembers = this.getexistingMembers();
  }

  onMembersChanged(memberIds) {
    this.memberIds = memberIds;
  }

  getexistingMembers() {
    if (this.channel.isEmail || this.channel.isCustomer) {
      return this.channel.members.filter(x => x.role === RoleType.member);
    } else {
      return this.channel.members;
    }
  }

  submit() {
    if (this.memberIds.length > 0) {
      this.dialogRef.close(this.memberIds);
    }
  }
}
