import { Component, OnInit } from '@angular/core';
import { OrgMemberService } from '@b3networks/api/auth';
import { finalize } from 'rxjs/operators';
import { MatDialogRef } from '@angular/material/dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { X } from '@b3networks/shared/common';

@Component({
  selector: 'pom-transfer-member-role-dialog',
  templateUrl: './transfer-owner-dialog.component.html',
  styleUrls: ['./transfer-owner-dialog.component.scss']
})
export class TransferOwnerDialogComponent implements OnInit {
  progressing: boolean;
  newOwnerUuid: string;

  constructor(
    private orgMemberService: OrgMemberService,
    private dialogRef: MatDialogRef<TransferOwnerDialogComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  transfer() {
    this.progressing = true;

    this.orgMemberService
      .transferOwner(X.orgUuid, this.newOwnerUuid)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({
            transfered: true
          });
          this.toastService.success('Transfered role successfully');
        },
        err => {
          this.toastService.warning(err.message || 'Can not transfer member role. Please try again later');
        }
      );
  }
}
