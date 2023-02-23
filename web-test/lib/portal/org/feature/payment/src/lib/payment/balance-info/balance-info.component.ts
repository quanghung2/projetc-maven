import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ProfileOrg } from '@b3networks/api/auth';
import { SellerWallet, SellerWalletService } from '@b3networks/api/billing';
import { PortalConfig } from '@b3networks/api/partner';
import { Topup2Component, Topup2Input } from '@b3networks/portal/shared';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'pop-balance-info',
  templateUrl: './balance-info.component.html',
  styleUrls: ['./balance-info.component.scss']
})
export class BalanceInfoComponent {
  @Input() portalConfig: PortalConfig;
  @Input() organization: ProfileOrg;
  @Input() wallet: SellerWallet;
  @Output() topuped = new EventEmitter();

  isLoading: boolean;

  ABS = Math.abs;

  constructor(private sellerWalletService: SellerWalletService, private dialog: MatDialog) {}

  onTopup(wallet: SellerWallet) {
    const config: Topup2Input = {
      wallet: wallet,
      showAutoTopup: true
    };

    this.dialog
      .open(Topup2Component, {
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
          setTimeout(() => {
            this._refreshWallets();
          }, 100);
        }
        this.topuped.emit(result);
      });
  }

  showMoreAboutCredit(wallet: SellerWallet) {
    let message: string;

    if (wallet.postpaid) {
      message = `
    <p><strong>Current Balance:</strong> the amount stored in this wallet. <strong>Current Balance = - (unbilled amount + amount due).</strong></p>
    <p><strong>Expecting invoice = Unbilled amount:</strong> the usage amount for the current bill period.</p>
    <p><strong>Amount due:</strong> the sum of all costs that the account has been invoiced for, minus any payments that have been applied to those costs. </p>
    ${
      wallet.creditLimit
        ? '<p><strong>Credit limit:</strong> the maximum amount of money that you let the account borrow. </p>'
        : ''
    }
    <p><strong>Reserved credit</strong> is caused by an ongoing transaction. If the transaction is successful, Reserved credit is consumed; otherwise, it is released.</p>
    ${
      this.organization.isPartner
        ? '<p><strong>Liability:</strong> the total balance of the customers. This figure can be found in Finance app > Organization Management.</p>'
        : ''
    }
    `;
    } else {
      message = `
    <p><strong>Usable credit:</strong> the amount that you can spend on, i.e. credit transfer/ issue, usage and subscription renewal. <strong>Usable credit = Balance - Reserved credit - Liability ${
      wallet.creditLimit ? '+ Credit limit' : ''
    } </strong></p>
    <p><strong>Balance:</strong> the amount stored in this wallet.</p>
    <p><strong>Reserved credit</strong> is caused by an ongoing transaction. If the transaction is successful, Reserved credit is deducted; otherwise, it is returned to the Usable credit.</p>
    ${
      this.organization.isPartner
        ? '<p><strong>Liability:</strong> the total balance of your customer. This figure can be found in Finance app - Organization management.</p>'
        : ''
    }
    ${
      wallet.creditLimit
        ? '<p><strong>Credit limit:</strong> the maximum amount of money the service provider lets you borrow.</p>'
        : ''
    }
     `;
    }

    this.dialog.open(ConfirmDialogComponent, {
      data: <ConfirmDialogInput>{
        title: 'Learn more about credits',
        confirmLabel: 'OK',
        hideCancel: true,
        message: message
      }
    });
  }

  private _refreshWallets() {
    this.isLoading = true;
    this.sellerWalletService
      .getWallets(this.wallet.sellerUuid)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe();
  }
}
