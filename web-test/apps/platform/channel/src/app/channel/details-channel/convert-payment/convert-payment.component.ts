import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { BuyerWallet } from '@b3networks/api/billing';
import { WalletService } from 'libs/api/billing/src/lib/wallet/wallet.service';
import { finalize } from 'rxjs/operators';

export interface ConvertPaymentInput {
  buyerWallet: BuyerWallet;
  partnerUuid: string;
}

@Component({
  selector: 'b3n-convert-payment',
  templateUrl: './convert-payment.component.html',
  styleUrls: ['./convert-payment.component.scss']
})
export class ConvertPaymentComponent implements OnInit {
  updating: boolean;
  payment: string;
  postpaid: boolean;
  buyerUuid: string;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: ConvertPaymentInput,
    private walletService: WalletService,
    private dialogRef: MatDialogRef<ConvertPaymentComponent>
  ) {
    this.postpaid = data.buyerWallet?.postpaid || null;
  }

  ngOnInit(): void {
    this.payment = this.postpaid ? 'Prepaid' : 'Postpaid';
  }

  update() {
    this.updating = true;
    this.walletService
      .updateBuyerWallets(this.data.partnerUuid, this.data.buyerWallet.currency, this.postpaid)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(e => {
        this.dialogRef.close(true);
      });
  }
}
