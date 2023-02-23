import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Pageable } from '@b3networks/api/common';
import {
  ChannelHyperspace,
  ChannelHyperspaceService,
  HyperspaceQuery,
  RequestNamespacesHyper,
  ReqUpdateUsersChannelHyper,
  RoleUserHyperspace,
  UserHyperspace
} from '@b3networks/api/workspace';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, finalize, map, startWith, switchMap } from 'rxjs/operators';

export interface InviteMemberHyperInput {
  hyperId: string;
  channel: ChannelHyperspace;
}

@Component({
  selector: 'b3n-invite-member-hyper',
  templateUrl: './invite-member-hyper.component.html',
  styleUrls: ['./invite-member-hyper.component.scss']
})
export class InviteMemberHyperComponent extends DestroySubscriberComponent implements OnInit {
  isSave: boolean;
  searchMember = new UntypedFormControl('');
  members$: Observable<UserHyperspace[]>;
  pageable = new Pageable(0, 10);
  selectedUuids: string[] = [];

  private usersSelected: UserHyperspace[] = []; // chatUserid

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: InviteMemberHyperInput,
    private dialogRef: MatDialogRef<InviteMemberHyperComponent>,
    private toastService: ToastService,
    private hyperspaceQuery: HyperspaceQuery,
    private channelHyperspaceService: ChannelHyperspaceService
  ) {
    super();
  }

  ngOnInit(): void {
    const usersJoined = this.data.channel.allMembers?.map(x => x.userID) || [];
    this.members$ = this.searchMember.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap((queryString: string) => {
        queryString = queryString?.trim()?.toUpperCase() || '';
        return this.hyperspaceQuery
          .selectPropertyHyperspace(this.data.hyperId, 'allMembers')
          .pipe(
            map(users =>
              users.filter(
                u => !usersJoined.includes(u.userUuid) && u?.displayName?.toUpperCase().includes(queryString)
              )
            )
          );
      })
    );
  }

  onSelectedMember(member: UserHyperspace) {
    const index = this.usersSelected.findIndex(x => x.userUuid === member.userUuid);
    if (index === -1) {
      this.usersSelected.push(member);
      this.selectedUuids.push(member.userUuid);
    } else {
      this.usersSelected.splice(index, 1);
      this.selectedUuids.splice(index, 1);
    }
  }

  onSave() {
    if (this.usersSelected.length === 0 || this.isSave) {
      return;
    }

    this.isSave = true;
    const req = <ReqUpdateUsersChannelHyper>{
      hyperspaceId: this.data.channel.hyperspaceId,
      hyperchannelId: this.data.channel.id,
      add: []
    };
    const hyper = this.hyperspaceQuery.getEntity(this.data.hyperId);
    const memberCurrentOrg = this.usersSelected.filter(u => u.orgUuid === hyper.currentOrg.uuid);
    if (memberCurrentOrg.length > 0) {
      req.add.push(<RequestNamespacesHyper>{
        namespaceId: hyper.currentOrg.uuid,
        users: memberCurrentOrg.map(u => ({
          id: u.userUuid,
          role: RoleUserHyperspace.member
        }))
      });
    }

    const memberOtherOrg = this.usersSelected.filter(u => u.orgUuid === hyper.otherOrg.uuid);
    if (memberOtherOrg.length > 0) {
      req.add.push(<RequestNamespacesHyper>{
        namespaceId: hyper.otherOrg.uuid,
        users: memberOtherOrg.map(u => ({
          id: u.userUuid,
          role: RoleUserHyperspace.member
        }))
      });
    }

    this.channelHyperspaceService
      .updateUsersChannelHyper(req)
      .pipe(finalize(() => (this.isSave = false)))
      .subscribe(
        res => {
          this.toastService.success('Add member successfully!');
          this.dialogRef.close(true);
        },
        error => {
          this.toastService.error(error.message || 'Add member failed!');
          this.dialogRef.close(false);
        }
      );
  }
}
