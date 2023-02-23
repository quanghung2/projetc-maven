import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthenticationMode, ReqUpdateIpPeer, SipAccount, SipTrunkService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

export interface EditIpSipInput {
  sip: SipAccount;
  updateIpPeerReq: ReqUpdateIpPeer;
}

@Component({
  selector: 'b3n-edit-ip-sip',
  templateUrl: './edit-ip-sip.component.html',
  styleUrls: ['./edit-ip-sip.component.scss']
})
export class EditIpSipComponent implements OnInit {
  processing: boolean;
  authenticationMode: AuthenticationMode;

  readonly AuthenticationMode = AuthenticationMode;

  constructor(
    private sipTrunkService: SipTrunkService,
    private toastService: ToastService,
    @Inject(MAT_DIALOG_DATA) public data: EditIpSipInput,
    private dialogRef: MatDialogRef<EditIpSipComponent>
  ) {
    this.authenticationMode = data.sip?.detail?.config?.authenticationMode;
  }

  ngOnInit() {}

  submit() {
    const changed = this.data.sip.detail?.config?.authenticationMode !== this.authenticationMode;
    if (changed) {
      this.processing = true;
      this.sipTrunkService
        .updateAuthenticationMode(this.data.sip.sipUsername, this.authenticationMode)
        .pipe(
          switchMap(_ =>
            this.authenticationMode === AuthenticationMode.IP
              ? this.sipTrunkService.updateIpPeer(this.data.sip.sipUsername, this.data.updateIpPeerReq)
              : of(null)
          ),
          finalize(() => (this.processing = false))
        )
        .subscribe(
          _ => {
            this.toastService.success('Update successfully.');
            this.dialogRef.close(true);
          },
          err => this.toastService.error(err.message)
        );
    } else {
      if (this.authenticationMode === AuthenticationMode.IP) {
        this.processing = true;

        this.sipTrunkService
          .updateIpPeer(this.data.sip.sipUsername, this.data.updateIpPeerReq)
          .pipe(finalize(() => (this.processing = false)))
          .subscribe(
            _ => {
              this.toastService.success('Update successfully.');
              this.dialogRef.close(true);
            },
            err => this.toastService.error(err.message)
          );
      }
    }
  }
}
