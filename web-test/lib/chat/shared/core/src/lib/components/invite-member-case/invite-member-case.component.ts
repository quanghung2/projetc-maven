import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OrgMemberService, SearchMemberIncludeTeam } from '@b3networks/api/auth';
import { AgentQuery } from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { Inbox, InboxesService } from '@b3networks/api/inbox';
import { GroupType, MeQuery, Privacy, TXN_SECTION, User, UserQuery, UserStatus } from '@b3networks/api/workspace';
import { X } from '@b3networks/shared/common';
import { combineLatest, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, finalize, map, startWith, switchMap } from 'rxjs/operators';
import { SupportedConvo } from '../../core/adapter/convo-helper.service';
import { AssignLeftReq, Txn } from '../../core/service/txn/txn.model';
import { TxnService } from '../../core/service/txn/txn.service';

const DEFAULT_SIZE = 50;

@Component({
  selector: 'csh-invite-member-case',
  templateUrl: './invite-member-case.component.html',
  styleUrls: ['./invite-member-case.component.scss']
})
export class InviteMemberCaseComponent implements OnInit {
  @ViewChild('memberInput') memberInput: ElementRef;

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
  filteredMembers$: Observable<User[]>;
  key = '';
  processing: boolean;
  loading = true;

  private _inbox: Inbox;

  constructor(
    private meQuery: MeQuery,
    private userQuery: UserQuery,
    private agentQuery: AgentQuery,
    private txnService: TxnService,
    @Inject(MAT_DIALOG_DATA) public data: { txn: Txn; convo: SupportedConvo },
    private dialogRef: MatDialogRef<InviteMemberCaseComponent>,
    private orgMemberService: OrgMemberService,
    private inboxesService: InboxesService
  ) {}

  ngOnInit() {
    this.me = this.meQuery.getMe();
    if (this.data?.txn?.inboxUuid) {
      combineLatest([
        this.inboxesService.getDetail(this.data.txn.inboxUuid),
        this.txnService.getDetailTxn(this.data.txn.txnUuid)
      ])
        .pipe(finalize(() => (this.loading = false)))
        .subscribe(([inbox, detail]) => {
          this._inbox = inbox;
          this.data.txn = detail;
          this.updateFilteredMembers();
        });
    } else {
      this.updateFilteredMembers();
      this.loading = false;
    }
  }

  updateFilteredMembers() {
    this.filteredMembers$ = this.data?.txn?.inboxUuid
      ? this.memberCtrl.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          startWith(this.memberCtrl.value),
          switchMap((name: string | null) => {
            if (typeof name === 'string' && name) {
              this.key = name;

              return this.orgMemberService
                .searchMembers(
                  X.orgUuid,
                  <SearchMemberIncludeTeam>{
                    keyword: name?.trim(),
                    filterByTeamUuids: this._inbox?.teams || [],
                    status: 'ACTIVE'
                  },
                  new Pageable(0, 50)
                )
                .pipe(
                  map(members =>
                    members
                      ?.filter(
                        m =>
                          !this.members.some(x => x.identityUuid === m.identityUuid) &&
                          !this.data.txn?.lastAssignedAgents?.some(x => x === m.identityUuid)
                      )
                      ?.map(
                        agent =>
                          this.userQuery.getEntity(agent.identityUuid) ||
                          new User({
                            identityUuid: agent.identityUuid,
                            displayName: agent.name
                          })
                      )
                      .slice(0, DEFAULT_SIZE)
                  )
                );
            }

            return this.orgMemberService
              .searchMembers(
                X.orgUuid,
                <SearchMemberIncludeTeam>{
                  keyword: '',
                  filterByTeamUuids: this._inbox?.teams || [],
                  status: 'ACTIVE'
                },
                new Pageable(0, 50)
              )
              .pipe(
                map(members =>
                  members
                    ?.filter(
                      m =>
                        !this.members.some(x => x.identityUuid === m.identityUuid) &&
                        !this.data.txn?.lastAssignedAgents?.some(x => x === m.identityUuid)
                    )
                    ?.map(
                      agent =>
                        this.userQuery.getEntity(agent.identityUuid) ||
                        new User({
                          identityUuid: agent.identityUuid,
                          displayName: agent.name
                        })
                    )
                    .slice(0, DEFAULT_SIZE)
                )
              );
          })
        )
      : this.memberCtrl.valueChanges.pipe(
          distinctUntilChanged(),
          startWith(this.memberCtrl.value),
          map((name: string | null) => {
            let query: User[] = [];
            if (typeof name === 'string' && name) {
              this.key = name;
              query = this.agentQuery
                .getAllAgentsContains(name)
                .filter(
                  agent =>
                    !this.members.some(x => x.identityUuid === agent.identityUuid) &&
                    !this.data.txn?.lastAssignedAgents?.some(x => x === agent.identityUuid)
                )
                .map(
                  agent =>
                    this.userQuery.getEntity(agent.identityUuid) ||
                    new User({
                      identityUuid: agent.identityUuid,
                      displayName: agent.displayText
                    })
                )
                .slice(0, DEFAULT_SIZE);
            } else {
              query = this.agentQuery
                .getAll({
                  filterBy: agent =>
                    !this.members.some(x => x.identityUuid === agent.identityUuid) &&
                    !this.data.txn?.lastAssignedAgents?.some(x => x === agent.identityUuid),
                  limitTo: DEFAULT_SIZE
                })
                .map(
                  agent =>
                    this.userQuery.getEntity(agent.identityUuid) ||
                    new User({
                      identityUuid: agent.identityUuid,
                      displayName: agent.displayText
                    })
                );
            }
            return query;
          })
        );
  }

  trackBy(i, member: User) {
    return member != null ? member.identityUuid : null;
  }

  selected(event: MatAutocompleteSelectedEvent) {
    if (this.members.length > 0) {
      return;
    }

    const user = <User>event.option.value;
    if (!this.members.some(x => x.identityUuid === user.identityUuid)) {
      this.members.push(user);
      this.updateFilteredMembers();
    }
    this.memberInput.nativeElement.value = '';
    this.memberCtrl.setValue(null);
    this.memberCtrl.disable();
    this.memberCtrl.enable();
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

    if (this.data.txn?.inboxUuid) {
      this.txnService
        .joinTxnV2(this.data.txn.txnUuid, this.members[0].identityUuid)
        .pipe(
          finalize(() => {
            this.processing = false;
          })
        )
        .subscribe(() => this.dialogRef.close());
    } else {
      const req = <AssignLeftReq>{
        agentUuid: this.members[0].identityUuid,
        txnUuid: this.data.convo.id
      };
      this.txnService
        .assign(req)
        .pipe(
          finalize(() => {
            this.processing = false;
          })
        )
        .subscribe(() => this.dialogRef.close());
    }
  }
}
