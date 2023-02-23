import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChurnService } from '@b3networks/api/churn';
import { Subscription, SubscriptionService, SubsctiptionRequestParams } from '@b3networks/api/subscription';
import { MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'pos-unsubscribe-dialog',
  templateUrl: './unsubscribe-dialog.component.html',
  styleUrls: ['./unsubscribe-dialog.component.scss']
})
export class UnsubscribeDialogComponent implements OnInit {
  loading = false;
  reason = '';
  selectedId = 1;
  reasons = [
    { id: 1, text: 'Pricing issue - Not have a good comparing to markets' },
    { id: 2, text: 'Service issue - Bad experience when seeking helps from service team' },
    { id: 3, text: "App issue - Constraints, doesn't fit with expectation" },
    { id: 4, text: 'Quality issue - Bad experience in call/sms quality' },
    { id: 5, text: 'Company close - No need service any more' },
    { id: 6, text: 'Other (fill in below)' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Subscription,
    private toastr: ToastService,
    private dialogRef: MatDialogRef<UnsubscribeDialogComponent>,
    private subscriptionService: SubscriptionService,
    private churnService: ChurnService
  ) {}

  ngOnInit(): void {}

  unsubscribe() {
    this.loading = true;
    const refinedReason = '[UNSUBSCRIBE] ' + this.reason.trim();

    this.subscriptionService
      .updateSubscriptionInfo(this.data.uuid, new SubsctiptionRequestParams({ autoRenew: false }))
      .pipe(switchMap(() => this.churnService.setReason(this.data.uuid, refinedReason)))
      .subscribe(
        () => {
          this.loading = false;
          this.dialogRef.close({ autoRenew: false });
          this.toastr.success(
            `You are unsubscribe ${this.data.primaryItem.productName} success. Please press 're-subscribe' if you want to renew this.`
          );
        },
        _ => {
          this.loading = false;
          this.toastr.error(MessageConstants.GENERAL_ERROR);
        }
      );
  }
}
