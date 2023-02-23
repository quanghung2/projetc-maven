import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { Wallet } from '@b3networks/api/billing';
import { PortalConfig, PortalConfigQuery } from '@b3networks/api/partner';
import { RecoveryResponseV2 } from '@b3networks/api/subscription';
import { TopupComponent, TopupInput } from '@b3networks/portal/shared';

@Component({
  selector: 'b3n-select-subscription',
  templateUrl: './select-subscription.component.html',
  styleUrls: ['./select-subscription.component.scss']
})
export class SelectSubscriptionComponent implements OnInit {
  horizontalPosition: MatSnackBarHorizontalPosition = 'end';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  displayedColumns: string[] = ['subscriptions', 'amount'];
  topupAmount: number;
  potalConfig: PortalConfig;

  @Input() wallet: Wallet;
  @Input() totalAmount: number;
  @Input() loading: boolean;
  @Input() subscriptions: RecoveryResponseV2[] = [];
  @Output() topuped = new EventEmitter();

  constructor(private dialog: MatDialog, private portalConfigQuery: PortalConfigQuery) {}

  ngOnInit(): void {
    this.portalConfigQuery.portalConfig$.subscribe(potalConfig => {
      this.potalConfig = potalConfig;
    });
  }

  getRemainCredits() {
    const totalCharge =
      this.subscriptions &&
      this.subscriptions
        .filter(x => x.isSelected)
        .map(x => x.amount)
        .reduce((a, b) => a + b, 0);
    const remainPrice = this.wallet?.balance?.availableForReservation - totalCharge;
    if (remainPrice > 0) {
      this.topupAmount = Math.ceil(Math.abs(remainPrice));
    }
    return Math.round(remainPrice * 1000) / 1000;
  }

  someComplete() {
    if (!this.subscriptions.length) {
      return false;
    }

    return this.subscriptions.filter(item => item.isSelected).length > 0 && !this.isAllChecked();
  }

  isAllChecked() {
    return this.subscriptions.every(x => x.isSelected);
  }

  onSelected(event: MatCheckboxChange, index: number) {
    this.subscriptions[index].isSelected = event.checked;
  }

  onCheckAll(event: MatCheckboxChange) {
    this.subscriptions.map(x => (x.isSelected = event.checked));
  }

  openTopup() {
    const config: TopupInput = {
      showAutoTopup: true,
      currency: this.wallet.currency,
      topupAmount: this.topupAmount
    };

    this.dialog
      .open(TopupComponent, {
        width: '100%',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        data: config
      })
      .afterClosed()
      .subscribe(result => {
        if (result?.cancel) {
          return;
        }
        if (!result?.error) {
          this.topuped.emit();
        }
      });
  }
}
