import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SkuPrice, SkuPriceService } from '@b3networks/api/salemodel';
import {
  FindSubscriptionReq,
  Subscription,
  SubscriptionService,
  SubsctiptionRequestParams
} from '@b3networks/api/subscription';
import { MessageConstants } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable } from 'rxjs';
import { finalize, map, mergeMap } from 'rxjs/operators';

@Component({
  selector: 'pos-billing-cycle-dialog',
  templateUrl: './billing-cycle-dialog.component.html',
  styleUrls: ['./billing-cycle-dialog.component.scss']
})
export class BillingCycleDialogComponent implements OnInit {
  loading = false;
  listSkuPrice: SkuPrice[] = [];
  selectedSaleModelCode = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: Subscription,
    private toastr: ToastService,
    private dialogRef: MatDialogRef<BillingCycleDialogComponent>,
    private subscriptionService: SubscriptionService,
    private skuPriceService: SkuPriceService
  ) {}

  ngOnInit(): void {
    this.selectedSaleModelCode = this.data.primaryItem.saleModelCode;
    const linkApi: Observable<SkuPrice[]>[] = [];
    linkApi.push(this.skuPriceService.getProductSkuPrices(this.data.primaryItem.productId, this.data.primaryItem.sku));

    this.data.items.forEach(i => {
      if (!i.primary) {
        linkApi.push(this.skuPriceService.getProductSkuPrices(i.productId, i.sku));
      }
    });

    forkJoin(linkApi)
      .pipe(
        map(res => {
          res[0].forEach(sm => {
            let allowAdd = true;
            res.forEach(e => {
              const item = e.find(x => x.saleModel == sm.saleModel);
              if (!item) {
                allowAdd = false;
              }
            });
            if (allowAdd && !sm.isBlocked) {
              this.listSkuPrice.push(sm);
            }
          });
        })
      )
      .subscribe();
  }

  chooseItem(s: SkuPrice) {
    this.selectedSaleModelCode = s.saleModel;
  }

  select() {
    if (this.data.primaryItem.saleModelCode !== this.selectedSaleModelCode) {
      this.loading = true;
      this.subscriptionService
        .updateSubscriptionInfo(
          this.data.uuid,
          new SubsctiptionRequestParams({ multiplier: 1, saleModelCode: this.selectedSaleModelCode })
        )
        .pipe(
          mergeMap(() => {
            const subscriptionReq = new FindSubscriptionReq({
              uuid: this.data.uuid,
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
            this.toastr.success(`You have changed billing cycle to ${this.selectedSaleModelCode}. 
            The total price is ${res.data[0].displayTotalPrice} ${res.data[0].currency} and will be charged if you want to extend this subscription.`);
            this.dialogRef.close(res.data[0]);
          },
          error => {
            this.toastr.error(MessageConstants.GENERAL_ERROR);
          }
        );
    } else {
      this.dialogRef.close();
    }
  }
}
