import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  IdentityProfileQuery,
  OrgMemberQuery,
  OrgMemberService,
  ResendActivationEmailReq,
  Team
} from '@b3networks/api/auth';
import { MemberRole, MemberStatus } from '@b3networks/api/member';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { AddMemberComponent } from '../add-member/add-member.component';
import { ExportMembersComponent } from '../export-members/export-members.component';
import { ImportMembersComponent } from '../import-members/import-members.component';

export interface InputExportMemberData {
  status: MemberStatus;
  isLicenseOrg: boolean;
  teamUuid?: string;
}

@Component({
  selector: 'pom-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class ActionBarComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  readonly Status = MemberStatus;
  readonly roleOptions: KeyValue<MemberRole, string>[] = [
    { key: MemberRole.OWNER, value: 'Owner' },
    { key: MemberRole.ADMIN, value: 'Admin' },
    { key: MemberRole.MEMBER, value: 'Member' }
  ];
  statuses = [MemberStatus.ACTIVE, MemberStatus.DISABLED];

  @Input() filterFG: UntypedFormGroup;
  @Input() isManagedEveryone: boolean;
  @Input() managedTeams: Team[];
  @Input() includePendingStatus: boolean;

  @Output() importMemberEvent = new EventEmitter<boolean>();
  @Output() addMemberEvent = new EventEmitter<boolean>();

  hasPendingMembers$: Observable<boolean>;
  isLicenseOrg: boolean;

  constructor(
    private dialog: MatDialog,
    private orgMemberService: OrgMemberService,
    private toastService: ToastService,
    private orgMemberQuery: OrgMemberQuery,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.statuses = this.includePendingStatus
      ? [MemberStatus.ACTIVE, MemberStatus.PENDING, MemberStatus.DISABLED]
      : [MemberStatus.ACTIVE, MemberStatus.DISABLED];
  }

  ngOnInit() {
    this.hasPendingMembers$ = this.orgMemberQuery.select('hasPendingMember');
    this.isLicenseOrg = this.profileQuery.currentOrg?.licenseEnabled;
  }

  addMember() {
    this.dialog
      .open(AddMemberComponent, {
        width: '500px'
      })
      .afterClosed()
      .subscribe(added => {
        if (added && added.success) {
          this.addMemberEvent.emit(true);
        }
      });
  }

  export() {
    this.dialog.open(ExportMembersComponent, {
      width: '450px',
      autoFocus: false,
      data: <InputExportMemberData>{
        status: this.filterFG.value.status,
        isLicenseOrg: this.isLicenseOrg,
        teamUuid: this.filterFG.value.teamUuid
      }
    });
  }

  import() {
    this.dialog
      .open(ImportMembersComponent, {
        width: '450px',
        autoFocus: false
      })
      .afterClosed()
      .subscribe(status => {
        if (status && status.ok) {
          this.importMemberEvent.emit(true);
        }
      });
  }

  confirmAndSendActivationEmails() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        autoFocus: false,
        data: <ConfirmDialogInput>{
          title: 'Send activation emails',
          message: 'Do you want to send activation emails?',
          confirmLabel: 'Send'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          const memberUuids = ['*'];
          const req = { memberUuids: memberUuids } as ResendActivationEmailReq;
          this.orgMemberService.resendActivationEmails(req).subscribe(
            _ => {
              this.toastService.success('Sent request. Please check your email in a few minutes');
            },
            error => {
              this.toastService.error('An error occurred. Please try again in a few minutes');
            }
          );
        }
      });
  }
}
