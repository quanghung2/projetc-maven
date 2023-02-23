import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AgentQuery } from '@b3networks/api/callcenter';
import {
  Channel,
  ChannelService,
  ConversationGroup,
  GroupType,
  MeQuery,
  Privacy,
  TXN_SECTION,
  UpdateChannelReq,
  User,
  UserQuery,
  UserStatus
} from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map, startWith } from 'rxjs/operators';
import { SupportedConvo } from '../../core/adapter/convo-helper.service';
import { AssignLeftReq } from '../../core/service/txn/txn.model';
import { TxnQuery } from '../../core/service/txn/txn.query';
import { TxnService } from '../../core/service/txn/txn.service';

const DEFAULT_SIZE = 5;

@Component({
  selector: 'csh-invite-member',
  templateUrl: './invite-member.component.html',
  styleUrls: ['./invite-member.component.scss']
})
export class InviteMemberComponent implements OnInit {
  readonly TXN_SECTION = TXN_SECTION;
  readonly GroupType = GroupType;
  readonly Privacy = Privacy;
  readonly UserStatus = UserStatus;
  me: User;
  members: User[] = [];
  selectable = true;
  removable = true;
  addOnBlur = true;
  separatorKeysCodes = [ENTER, COMMA];
  memberCtrl = new UntypedFormControl();
  filteredMembers: Observable<User[]>;
  agentUuid: string;
  key = '';

  generalButtonOptions = {
    active: false,
    spinnerSize: 18,
    raised: true,
    stroked: false,
    spinnerColor: 'accent',
    fullWidth: false,
    disabled: false,
    mode: 'indeterminate'
  };

  ctaButton: string;
  processing: boolean;

  @ViewChild('memberInput') memberInput: ElementRef;

  constructor(
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private agentQuery: AgentQuery,
    private txnQuery: TxnQuery,
    private txnService: TxnService,
    private channelService: ChannelService,
    private toastService: ToastService,
    @Inject(MAT_DIALOG_DATA) public convo: SupportedConvo,
    private dialogRef: MatDialogRef<InviteMemberComponent>
  ) {
    this.ctaButton =
      this.convo.type === GroupType.WhatsApp || this.convo.type === GroupType.SMS
        ? this.convo.members?.length === 1
          ? 'Assign'
          : 'Transfer'
        : 'Invite';
  }

  ngOnInit() {
    this.me = this.meQuery.getMe();
    this.updateFilteredMembers();
    const txn = this.txnQuery.getEntity(this.convo.id);
    if (txn && txn.lastAssignedAgents && txn.lastAssignedAgents?.length > 0) {
      this.agentUuid = txn.lastAssignedAgents[txn.lastAssignedAgents.length - 1];
    }
  }

  updateFilteredMembers() {
    const userIds =
      this.convo instanceof ConversationGroup
        ? this.convo.members.map(m => m.chatUserUuid)
        : this.convo instanceof Channel
        ? this.convo.participants.map(m => m.userID)
        : [];
    const listUser = this.userQuery.getAllUserByChatUuid(userIds);
    this.filteredMembers = this.memberCtrl.valueChanges.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      startWith(this.memberCtrl.value),
      map((name: string | null) => {
        if (typeof name === 'string' && name) {
          return this.filter(name);
        } else {
          if (this.convo.type === GroupType.WhatsApp || this.convo.type === GroupType.SMS) {
            return this.agentQuery
              .getAllAgents()
              .filter(
                agent =>
                  agent.identityUuid !== this.agentUuid &&
                  !this.members.map(m => m.identityUuid).includes(agent.identityUuid) &&
                  !listUser?.map(m => m.identityUuid).includes(agent.identityUuid)
              )
              .map(agent => {
                let user = Object.assign(new User(), this.userQuery.getUserByUuid(agent.identityUuid));

                if (!user) {
                  user = new User();
                  user.identityUuid = agent.identityUuid;
                }

                user.displayName = agent.displayText;
                return user;
              })
              .slice(0, DEFAULT_SIZE);
          }
          return this.userQuery
            .getAllUsers()
            .filter(
              member =>
                member.identityUuid !== this.me.identityUuid &&
                !this.members.map(m => m.identityUuid).includes(member.identityUuid) &&
                !listUser?.map(m => m.identityUuid).includes(member.identityUuid)
            )
            .slice(0, DEFAULT_SIZE);
        }
      })
    );
  }

  sortBy(members: User[]) {
    return members?.sort((a, b) => a?.displayName?.localeCompare(b?.displayName));
  }

  trackBy(_, member: User) {
    return member != null ? member.identityUuid : null;
  }

  selected(event: MatAutocompleteSelectedEvent) {
    if ((this.convo.type === GroupType.WhatsApp || this.convo.type === GroupType.SMS) && this.members.length > 0) {
      return;
    }

    if (!this.members.includes(event.option.value)) {
      this.members.push(event.option.value);
      this.updateFilteredMembers();
    }
    this.memberInput.nativeElement.value = '';
    this.memberCtrl.setValue(null);
    this.memberCtrl.disable();
    this.memberCtrl.enable();

    setTimeout(() => {
      this.memberInput.nativeElement.focus();
    }, 300);
  }

  filter(name: string) {
    this.key = name;

    const userIds =
      this.convo instanceof ConversationGroup
        ? this.convo.members.map(m => m.chatUserUuid)
        : this.convo instanceof Channel
        ? this.convo.participants.map(m => m.userID)
        : [];
    const users = this.userQuery.getAllUserByChatUuid(userIds);

    if (this.convo.type === GroupType.WhatsApp || this.convo.type === GroupType.SMS) {
      return this.agentQuery
        .getAllAgentsContains(name)
        .filter(
          agent =>
            agent.identityUuid !== this.agentUuid &&
            !this.members.map(m => m.identityUuid).includes(agent.identityUuid) &&
            !users?.map(m => m.identityUuid).includes(agent.identityUuid)
        )
        .map(agent => {
          let user = Object.assign(new User(), this.userQuery.getUserByUuid(agent.identityUuid));

          if (!user) {
            user = new User();
            user.identityUuid = agent.identityUuid;
          }

          user.displayName = agent.displayText;
          return user;
        });
    }

    return this.userQuery
      .getAllUsersContains(name, -1)
      .filter(
        member =>
          member.identityUuid !== this.me.identityUuid &&
          !this.members.map(m => m.identityUuid).includes(member.identityUuid) &&
          !users?.map(m => m.identityUuid).includes(member.identityUuid)
      );
  }

  remove(member: User) {
    const index = this.members.indexOf(member);

    if (index >= 0) {
      this.members.splice(index, 1);
    }
  }

  submit() {
    if (!this.members || this.members.length === 0) {
      this.dialogRef.close();
      return;
    }

    this.processing = true;
    if (this.convo.type === GroupType.WhatsApp || this.convo.type === GroupType.SMS) {
      const req = <AssignLeftReq>{
        agentUuid: this.members[0].identityUuid,
        txnUuid: this.convo.id
      };

      this.txnService.assign(req).subscribe(_ => {});

      this.processing = false;
      this.dialogRef.close();
    } else {
      const req = <UpdateChannelReq>{
        add: this.members.map(x => x.userUuid)
      };
      this.channelService
        .addOrRemoveParticipants(this.convo.id, req)
        .pipe(finalize(() => (this.processing = false)))
        .subscribe(
          _ => {
            this.dialogRef.close();
          },
          err => this.toastService.error('Cannot invite member, try again!')
        );
    }
  }
}
