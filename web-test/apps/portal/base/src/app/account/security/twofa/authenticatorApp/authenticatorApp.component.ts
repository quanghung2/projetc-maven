import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { TfaService, TotpRequest, TotpResponse } from '@b3networks/api/auth';
import { ModalService } from '../../../../shared/modal/modal.service';

@Component({
  selector: 'authenticatorApp-modal',
  templateUrl: './authenticatorApp.html',
  styleUrls: ['./authenticatorApp.scss']
})
export class AuthenticatorAppModal implements OnInit {
  qrSecret: string;
  qrCode = '';
  loading = true;
  step = 1;
  verificationCode = '';
  error = '';

  progressing: boolean;

  constructor(
    private tfaService: TfaService,
    private modalService: ModalService,
    private dialogRef: MatDialogRef<AuthenticatorAppModal>
  ) {
    this.tfaService.getTotpCode().subscribe((response: TotpResponse) => {
      this.qrCode = response.uri;
      this.qrSecret = response.secret;
      this.loading = false;
    });
  }

  ngOnInit() {}

  resetError() {
    this.error = '';
  }

  next() {
    this.step = 2;
  }

  verify() {
    this.progressing = true;
    this.resetError();
    this.tfaService.verifyTotpCode(new TotpRequest(this.qrSecret, this.verificationCode)).subscribe(
      _ => {
        this.tfaService.get2FaInfo().subscribe();
        this.modalService.openSuccessModal(
          "You're all set. From now on, you'll use Authenticator to sign in to your account."
        );
        this.dialogRef.close({ success: true });
        this.progressing = false;
      },
      error => {
        this.progressing = false;
        const data = error.error;
        this.error = data.message;
      }
    );
  }
}
