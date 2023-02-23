import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  ChatMessage,
  ChatService,
  ConversationGroup,
  ConversationGroupService,
  JoinLeaveFollowedData,
  Member,
  MeQuery,
  MessageBody,
  MsgType,
  RoleType,
  SystemMessageData,
  SystemMsgType,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { MessageConstants } from '@b3networks/chat/shared/core';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, Observable } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { intersection } from 'lodash';

@Component({
  selector: 'b3n-assign-multiple-member',
  templateUrl: './assign-multiple-member.component.html',
  styleUrls: ['./assign-multiple-member.component.scss']
})
export class AssignMultipleMemberDialog implements OnInit {
  me: User;
  members: Partial<Member>[] = [];
  isLoading: boolean;

  constructor(
    private conversationGroupService: ConversationGroupService,
    private dialogRef: MatDialogRef<AssignMultipleMemberDialog>,
    private toastService: ToastService,
    private userQuery: UserQuery,
    private meQuery: MeQuery,
    private chatService: ChatService,
    @Inject(MAT_DIALOG_DATA) private checkedConversationGroups: ConversationGroup[]
  ) {}

  ngOnInit() {
    this.meQuery.me$.pipe(filter(me => !!me)).subscribe(me => (this.me = me));
  }

  onMemberIdsChanged(members: string[]) {
    this.members = members.map(
      member =>
        <Member>{
          identityUuid: member,
          role: RoleType.member
        }
    );
  }

  submit() {
    if (this.members.length > 0) {
      const identityIds = this.members.map(member => member.identityUuid);

      const addMemberObserver: Observable<any>[] = [];
      const canAssignedConversationGroups: ConversationGroup[] = [];
      this.checkedConversationGroups.forEach(convoGroup => {
        const existingMemberIds = convoGroup.members
          .filter(member => member.role === RoleType.member)
          .map(m => m.identityUuid);
        const isConvoAlreadyAssigned = intersection(existingMemberIds, identityIds).length;
        if (!isConvoAlreadyAssigned) {
          canAssignedConversationGroups.push(convoGroup);
          addMemberObserver.push(this.conversationGroupService.addMembers(convoGroup.id, this.members));
        }
      });

      const assignedMembers = this.userQuery.getAllUserByIdentityIds(identityIds);
      const chatUserUuids = assignedMembers.map(user => user.userUuid);
      const memberNames = assignedMembers.map(user => user.displayName);

      this.isLoading = true;
      combineLatest(addMemberObserver)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe(
          _ => {
            canAssignedConversationGroups.forEach(convoGroup => {
              const messageBody: MessageBody = new MessageBody({
                text: MessageConstants.ASSIGN_CUSTOMER_CONVERSATION(this.me.displayName, memberNames.join(', ')),
                data: <SystemMessageData>{
                  type: SystemMsgType.join,
                  data: new JoinLeaveFollowedData({
                    join: chatUserUuids
                  })
                }
              });

              this.sendMessage(messageBody, convoGroup);
            });
            this.dialogRef.close();
          },
          () => {
            this.toastService.error(MessageConstants.DEFAULT);
          }
        );
    }
  }

  private sendMessage(messageBody: MessageBody, conversationGroup: ConversationGroup) {
    const message = ChatMessage.createEmailMessage(
      conversationGroup,
      new MessageBody(messageBody),
      this.me.userUuid,
      MsgType.system,
      false
    );

    this.chatService.send(message);
  }
}
