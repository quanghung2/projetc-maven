import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CreateCredentialRequest, OrgMemberService } from '@b3networks/api/auth';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'pom-create-credential',
  templateUrl: './create-credential.component.html',
  styleUrls: ['./create-credential.component.scss']
})
export class CreateCredentialComponent implements OnInit {
  progressing: boolean;
  emailAddress: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: string,
    private orgMemberService: OrgMemberService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<CreateCredentialComponent>
  ) {}

  ngOnInit() {}

  createCredential() {
    if (!this.emailAddress) {
      return;
    }

    this.progressing = true;
    const memberUuid = this.data;
    const req = new CreateCredentialRequest();
    req.email = this.emailAddress;

    this.orgMemberService
      .createCredential(X.orgUuid, memberUuid, req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close(true);
          this.toastService.success(
            'We’ll send an email with a verification URL to the registered email address. Please check and click on the URL to complete the process.'
          );
        },
        error => {
          error.code === 'auth.emailAlreadyRegistered'
            ? this.toastService.error('Email already registered')
            : this.toastService.error(error.message);
        }
      );
  }
}
