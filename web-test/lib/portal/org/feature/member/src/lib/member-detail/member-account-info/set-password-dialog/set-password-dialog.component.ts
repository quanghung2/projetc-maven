import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Member, MemberUpdateRequest, OrgMemberService, RealDomainService } from '@b3networks/api/auth';
import { encrypt, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'pom-set-password-dialog',
  templateUrl: './set-password-dialog.component.html',
  styleUrls: ['./set-password-dialog.component.scss']
})
export class SetPasswordDialogComponent implements OnInit {
  progressing: boolean;
  passwordCtrl = new UntypedFormControl('', Validators.required);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Member,
    private orgMemberService: OrgMemberService,
    private realDomainService: RealDomainService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<SetPasswordDialogComponent>
  ) {}

  ngOnInit() {}

  setPassword() {
    if (this.passwordCtrl.valid) {
      this.progressing = true;
      this.realDomainService.getRealDomainFromPortalDomain().subscribe(async realDomain => {
        const member = this.data;
        const req = new MemberUpdateRequest();
        req.role = member.role;
        req.status = member.memberStatus;
        req.title = member.title;
        if (!!realDomain.publicKey) {
          // encrypt password
          req.password = await encrypt(this.passwordCtrl.value, realDomain.publicKey);
        } else {
          req.password = this.passwordCtrl.value;
        }
        this.orgMemberService
          .updateMember(X.orgUuid, member.memberUuid, req)
          .pipe(finalize(() => (this.progressing = false)))
          .subscribe(
            _ => {
              this.toastService.success('Password has been set');
              this.dialogRef.close(true);
            },
            error => this.toastService.error(error.message)
          );
      });
    }
  }
}
