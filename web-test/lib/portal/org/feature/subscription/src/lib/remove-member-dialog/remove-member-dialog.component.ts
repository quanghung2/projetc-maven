import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FindSubscriptionReq, RemoveMemberReq, SubscriptionService } from '@b3networks/api/subscription';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'pos-remove-member-dialog',
  templateUrl: './remove-member-dialog.component.html',
  styleUrls: ['./remove-member-dialog.component.scss']
})
export class RemoveMemberDialogComponent implements OnInit {
  loading = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: RemoveMemberReq,
    private toastr: ToastService,
    private dialogRef: MatDialogRef<RemoveMemberDialogComponent>,
    private subscriptionService: SubscriptionService
  ) {}

  ngOnInit(): void {}

  removeMember() {
    this.loading = true;
    this.subscriptionService
      .removeMember(this.data.subscription.uuid, this.data.member.uuid)
      .pipe(
        mergeMap(() => {
          this.toastr.success(`You have successfully removed ${this.data.member.displayName}`);

          const subscriptionReq = new FindSubscriptionReq({
            uuid: this.data.subscription.uuid,
            embed: ['numbers', 'assignees', 'prices']
          });
          return this.subscriptionService.findSubscriptions(subscriptionReq, { page: 1, perPage: 1 });
        }),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        res => {
          this.dialogRef.close(res.data[0]);
        },
        err => {
          this.toastr.error(err.message);
        }
      );
  }
}
