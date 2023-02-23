import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { SellerWallet } from '@b3networks/api/billing';
import { AutoTopupSetting, GatewayInfo, PaymentService, StoredCardModel } from '@b3networks/api/payment';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DeleteStoredGatewayComponent } from './delete-stored-gateway/delete-stored-gateway.component';

@Component({
  selector: 'pop-stored-card',
  templateUrl: './stored-card.component.html',
  styleUrls: ['./stored-card.component.scss']
})
export class StoredCardComponent implements OnChanges {
  @Input() wallet: SellerWallet;
  @Input() settings: AutoTopupSetting;

  @Output() changedSettings = new EventEmitter();

  allGatewayStored: string[] = [];
  storedCards = new StoredCardModel();
  isLoading: boolean;

  constructor(private paymentService: PaymentService, private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['settings'] && this.settings) {
      this.storedCards.defaultGatewayName = this.settings.gatewayCode;

      if (this.wallet) {
        this._getGatewaysStored();
      }
    }
  }

  private _getGatewaysStored() {
    this.allGatewayStored = [];
    this.storedCards.gateways = [];
    this.isLoading = true;
    forkJoin([
      this.paymentService.getGateways('TOPUP'),
      this.paymentService.getStripeInfoV4(this.wallet.sellerUuid, this.wallet.currency)
    ])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(([gateWays, stripeInfo]) => {
        gateWays.forEach(gateway => {
          if (gateway.stored) {
            this.allGatewayStored.push(gateway.code);
            if (gateway.code !== 'stripe') {
              const gatewayInfo = new GatewayInfo();
              gatewayInfo.isStripe = false;
              gatewayInfo.name = gateway.code;

              if (this.storedCards.defaultGatewayName === gateway.code) {
                this.storedCards.gateways.unshift(gatewayInfo);
              } else {
                this.storedCards.gateways.push(gatewayInfo);
              }
            }
          }
        });

        if (stripeInfo && stripeInfo.paymentMethod) {
          const gatewayInfo = new GatewayInfo();
          gatewayInfo.isStripe = true;
          gatewayInfo.name = 'stripe';
          gatewayInfo.stripeCard = stripeInfo;
          if (this.storedCards.defaultGatewayName === 'stripe') {
            this.storedCards.gateways.unshift(gatewayInfo);
          } else {
            this.storedCards.gateways.push(gatewayInfo);
          }
        } else {
          this.allGatewayStored = this.allGatewayStored.filter(g => g !== 'stripe');
        }
      });
  }

  removeDefault(gateWaysName: string) {
    const data = {
      gateWaysName,
      defaultGatewayName: this.storedCards.defaultGatewayName,
      isLasted: this.storedCards.gateways.length === 1
    };
    this.dialog
      .open(DeleteStoredGatewayComponent, {
        width: '500px',
        data
      })
      .afterClosed()
      .subscribe(gateWaysName => {
        if (gateWaysName) {
          this._getGatewaysStored();
          if (gateWaysName === this.storedCards.defaultGatewayName) {
            this.changedSettings.emit();
            return;
          }
        }
      });
  }
}
