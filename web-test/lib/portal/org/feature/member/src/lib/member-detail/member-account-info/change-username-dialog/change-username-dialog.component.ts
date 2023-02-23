import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Member, OrgMemberService } from '@b3networks/api/auth';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'pom-change-username-dialog',
  templateUrl: './change-username-dialog.component.html',
  styleUrls: ['./change-username-dialog.component.scss']
})
export class ChangeUsernameDialogComponent implements OnInit {
  progressing: boolean;
  usernameCtrl = new UntypedFormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Member,
    private orgMemberService: OrgMemberService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<ChangeUsernameDialogComponent>
  ) {}

  ngOnInit() {}

  change() {
    if (this.usernameCtrl.valid) {
      this.progressing = true;
      const member = this.data;
      this.orgMemberService
        .updateMember(X.orgUuid, member.memberUuid, { username: this.usernameCtrl.value })
        .pipe(finalize(() => (this.progressing = false)))
        .subscribe(
          _ => {
            this.toastService.success('Username has been changed');
            this.dialogRef.close(true);
          },
          error => this.toastService.error(error.message)
        );
    }
  }
}
