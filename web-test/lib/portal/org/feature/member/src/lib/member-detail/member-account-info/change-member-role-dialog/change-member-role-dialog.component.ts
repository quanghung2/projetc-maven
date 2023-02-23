import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Member, MemberRole, MemberUpdateRequest, OrgMemberService } from '@b3networks/api/auth';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { delay, finalize } from 'rxjs/operators';

@Component({
  selector: 'pom-change-member-role-dialog',
  templateUrl: './change-member-role-dialog.component.html',
  styleUrls: ['./change-member-role-dialog.component.scss']
})
export class ChangeMemberRoleDialogComponent implements OnInit {
  roles: MemberRole[];
  selectedRole: MemberRole;
  progressing: boolean;
  fetching: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Member,
    private orgMemberService: OrgMemberService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<ChangeMemberRoleDialogComponent>
  ) {}

  ngOnInit() {
    this.fetching = true;
    this.orgMemberService
      .getRoleList(X.orgUuid)
      .pipe(delay(500))
      .pipe(finalize(() => (this.fetching = false)))
      .subscribe(
        roles => {
          this.roles = roles.filter(role => {
            //remove Guest role UI-1587
            return role !== this.data.role && role !== MemberRole.OWNER && role !== MemberRole.GUEST;
          });
          this.selectedRole = this.roles[0];
        },
        error => {
          this.toastService.error(error.message || 'Cannot fetch member roles. Please try again later.');
        }
      );
  }

  updateRole() {
    this.progressing = true;
    let memberUpdateRequest = new MemberUpdateRequest();
    memberUpdateRequest.role = this.selectedRole;
    this.orgMemberService
      .updateMember(X.orgUuid, this.data.uuid, memberUpdateRequest)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close(true);
          this.toastService.success(`You have changed role of ${this.data.displayName} to ${this.selectedRole}`);
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
