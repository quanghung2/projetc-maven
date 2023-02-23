import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Subscription, SubscriptionService, SubsctiptionRequestParams } from '@b3networks/api/subscription';
import { MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'pos-resubscribe-dialog',
  templateUrl: './resubscribe-dialog.component.html',
  styleUrls: ['./resubscribe-dialog.component.scss']
})
export class ResubscribeDialogComponent implements OnInit {
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Subscription,
    private toastr: ToastService,
    private dialogRef: MatDialogRef<ResubscribeDialogComponent>,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {}

  resubscribe() {
    this.loading = true;
    this.subscriptionService
      .updateSubscriptionInfo(this.data.uuid, new SubsctiptionRequestParams({ autoRenew: true }))
      .subscribe(
        () => {
          this.loading = false;
          this.dialogRef.close({ autoRenew: true });
          this.toastr.success(`You are resubscribe ${this.data.primaryItem.productName} success.`);
        },
        _ => {
          this.loading = false;
          this.toastr.error(MessageConstants.GENERAL_ERROR);
        }
      );
  }
}
