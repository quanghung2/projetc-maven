import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Member, MemberUpdateRequest, OrgMemberService } from '@b3networks/api/auth';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'psh-rename-member',
  templateUrl: './rename-member.component.html',
  styleUrls: ['./rename-member.component.scss']
})
export class RenameMemberComponent implements OnInit {
  name: string;
  progressing: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public member: Member,
    private memberService: OrgMemberService,
    private dialogRef: MatDialogRef<RenameMemberComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.name = this.member?.displayName;
  }

  rename() {
    this.progressing = true;
    const orgUuid = X.orgUuid;
    const memberUuid = this.member.uuid;
    const req = {
      name: this.name
    } as MemberUpdateRequest;
    this.memberService
      .updateMember(orgUuid, memberUuid, req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ ok: true });
          this.toastService.success('Updated successfully');
        },
        error => {
          this.toastService.error(error.message || 'Name has not been updated. Please try again in a moment');
        }
      );
  }
}
