import { animate, state, style, transition, trigger } from '@angular/animations';
import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SellerWallet, SellerWalletService } from '@b3networks/api/billing';
import {
  AutoTopupSetting,
  Gateway,
  Payment,
  PaymentService,
  StoredCard,
  StripeService,
  StripTopupAndStoreRequest,
  TopupGateway,
  TopupWithoutLimitationRequest
} from '@b3networks/api/payment';
import { LogService, SendLogReq } from '@b3networks/api/portal';
import { ToastService } from '@b3networks/shared/ui/toast';
import * as Sentry from '@sentry/browser';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, delay, finalize, mergeMap } from 'rxjs/operators';

const THREE_DS_AUTHENTICATE_FAILURE_MESSAGE =
  '3DS authentication failed. 3DS is required to proceed. Please check with your bank.';

export interface TopupInput {
  sellerUuid?: string;
  topupAmount?: number;
  showAutoTopup?: boolean;
  currency?: string;
}

export interface ProductSku {
  productId: string;
  sku: string;
  saleModelCode: string;
}

export interface GatewayType {
  title: string;
  isOnlineGateway: boolean;
}

@Component({
  selector: 'pop-topup',
  templateUrl: './topup.component.html',
  styleUrls: ['./topup.component.scss'],
  animations: [
    trigger('openStoreCard', [
      state('true', style({ opacity: 1 })),
      transition('void => *', [style({ opacity: 0 }), animate(500)])
    ])
  ]
})
export class TopupComponent implements OnInit {
  sellerUuid: string;
  topupConfig: TopupInput;
  wallet: SellerWallet;
  gateways: Gateway[] = [];
  topupAmount: number;
  supportedGatewayTypes: GatewayType[] = [{ title: 'Credit Card', isOnlineGateway: true }];
  autoTopupSetting: AutoTopupSetting;
  hasStoredGateway: boolean;
  openNewCard: boolean;
  selectedGateway: Gateway;
  enableAutoTopup: boolean;
  topupCreditFee: number;

  stripeCards: StoredCard[];
  selectedStripeCard: StoredCard;

  stripeAuthenticateUrl: SafeResourceUrl;
  openStripeAuthenticatePage: boolean;
  stripeAuthenticateLoading: boolean;

  isTopupLoading: boolean;
  charging: boolean;

  get lowerLitmitForAutoTopup() {
    if (this.topupAmount) {
      const threshold = this.selectedGateway.settings.threshold || 0;
      return Math.round(this.topupAmount * threshold * 1000) / 1000;
    } else {
      return 0;
    }
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: TopupInput,
    private dialogRef: MatDialogRef<TopupComponent>,
    private stripeService: StripeService,
    private paymentService: PaymentService,
    private sellerWalletService: SellerWalletService,
    private changeDetectorRef: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private toastr: ToastService,
    private logService: LogService
  ) {}

  ngOnInit(): void {
    this.topupConfig = this.data;
    this.isTopupLoading = true;
    of(this.data.sellerUuid)
      .pipe(mergeMap(value => (value ? of([this.data.sellerUuid]) : this.sellerWalletService.getSellers())))
      .subscribe(sellers => {
        this.sellerUuid = sellers.length > 0 ? sellers[0] : null;
        this.initData();
      });
  }

  close() {
    this.dialogRef.close({ cancel: true });
  }

  swithGatewayType(gatewayType: GatewayType) {
    let gateway;
    if (!gatewayType.isOnlineGateway) {
      gateway = this.gateways.find(g => g.isOfflineGateway);
    } else if (this.autoTopupSetting.gatewayCode) {
      gateway = this.gateways.find(g => g.code === this.autoTopupSetting.gatewayCode && g.isOnlineGateway && g.stored);
      if (!gateway) {
        gateway = this.gateways.find(g => g.isOnlineGateway && g.stored);
      }
    } else {
      gateway = this.gateways.find(g => g.isOnlineGateway && g.stored);
    }

    this.swithGateway(gateway);
  }

  swithGateway(gateway: Gateway) {
    if (gateway) {
      this.selectedGateway = gateway;
    } else {
      // using new card with stripe
      this.selectedGateway = this.gateways.find(g => g.isStripe);
      this.hasStoredGateway = false;
      this.enableAutoTopup = true;
    }

    this.updateTopupAmount();

    if (
      (!this.selectedGateway.isStripe && this.selectedGateway.stored) ||
      (this.selectedGateway.isStripe && this.stripeCards.length > 0)
    ) {
      this.hasStoredGateway = true;
      if (this.selectedGateway.isStripe && this.stripeCards.length > 0) {
        this.selectedStripeCard = this.stripeCards[0];
      }
    } else {
      this.hasStoredGateway = false;
      this.enableAutoTopup = true;
    }
  }

  onChangeTopupAmount(event) {
    const amount = event.target.value;
    this.topupAmount = Number(amount);
  }

  onChangePayment(event: MatRadioChange) {
    const gatewayType: GatewayType = this.supportedGatewayTypes.find(
      gateway => gateway.isOnlineGateway === event.value
    );
    this.swithGatewayType(gatewayType);
  }

  onChangeAutoTopup(event: MatSlideToggleChange) {
    this.enableAutoTopup = event.checked;
  }

  onSelectedGateWay(event: MatRadioChange) {
    const gateway: Gateway = this.gateways.find(gateways => gateways.code === event.value);

    this.swithGateway(gateway);
  }

  switch2NewCreditCard() {
    this.selectedStripeCard = null;
    this.selectedGateway = this.gateways.find(g => g.isStripe);
    this.openNewCard = !this.openNewCard;
  }

  switch2StoredCreditCard() {
    if (this.stripeCards.length > 0) {
      this.selectedStripeCard = this.stripeCards[0];
      this.selectedGateway = this.gateways.find(g => g.isStripe);

      this.openNewCard = !this.openNewCard;
    } else {
      this.selectedStripeCard = null;
      this.selectedGateway = this.gateways.find(g => g.isOnlineGateway && g.stored);
    }
  }

  makeTopup() {
    if (!this.topupAmount || !this.isNumeric(this.topupAmount)) {
      this.toastr.warning('Invalid topup amount. Please check again.');
      return;
    }
    if (this.selectedGateway.adminFeeThreshold === null && this.topupAmount < this.selectedGateway.minimumAmount) {
      this.toastr.warning(
        `Invalid topup amount. Please topup with amount don't less than ${this.selectedGateway.minimumAmount}` +
          ` ${this.wallet.currency}.`
      );
      return;
    }
    this.charging = true;
    of(this.selectedGateway)
      .pipe(
        mergeMap(gateway => {
          if (gateway.isOfflineGateway) {
            return this.makePaymentCall();
          }
          if (this.selectedStripeCard) {
            if (this.selectedGateway.code === 'stripe' && this.selectedStripeCard.threeDSecure !== 'not_supported') {
              return this.makeTopupFrom3DSource(this.selectedStripeCard.id);
            }

            return this.makePaymentCall();
          }

          return this.stripeService.createStripeCard().pipe(
            mergeMap(response => {
              if (response.error) {
                // Problem!
                Sentry.captureException(response.error);
                return throwError(response.error);
              }

              if (response.source.card.three_d_secure && response.source.card.three_d_secure !== 'not_supported') {
                return this.makeTopupFrom3DSource(response.source.id);
              } else {
                return this.makePaymentCall(response.source.id);
              }
            })
          );
        }),
        finalize(() => (this.charging = false))
      )
      .subscribe(
        payment => {
          this.dialogRef.close({ payment });
        },
        error => {
          this.logService
            .sendLog(<SendLogReq>{
              type: 'error',
              source: 'payment',
              data: error
            })
            .pipe(
              catchError(e => {
                console.error(e);
                return of(null);
              })
            )
            .subscribe();
          this.dialogRef.close({ error });
        }
      );
  }

  private initData() {
    this.supportedGatewayTypes = [{ title: 'Credit Card', isOnlineGateway: true }];
    this.topupAmount = this.topupConfig.topupAmount;
    this.enableAutoTopup = false;

    forkJoin([
      this.paymentService.getGateways('TOPUP'),
      this.paymentService.getSettings(),
      this.paymentService.getStripeCards(),
      this.sellerWalletService.getWallets(this.sellerUuid),
      this.paymentService.getStripeInfo(),
      this.stripeService.init()
    ])
      .pipe(finalize(() => (this.isTopupLoading = false)))
      .subscribe(([gateways, topupSetting, striperCards, wallets, stripeGW, isPublic]) => {
        this.wallet = wallets[0];
        if (this.wallet.postpaid && this.wallet.balance['outstandingBilled'] > 0) {
          this.topupAmount = this.wallet.balance['outstandingBilled'];
        }

        if (stripeGW?.adminFee) {
          gateways.forEach(g => {
            if (g.code === 'stripe') {
              g.adminFeeThreshold = stripeGW.adminFee?.threshold;
              this.topupCreditFee = stripeGW.adminFee?.amount;
              return;
            }
          });
        }
        this.gateways = gateways;

        this.gateways.sort((a, b) => (a.code < b.code ? 1 : a.code > b.code ? -1 : 0));
        if (this.gateways.find(g => g.stored)) {
          this.hasStoredGateway = true;
        }

        if (this.gateways.find(g => g.isOfflineGateway)) {
          this.supportedGatewayTypes.push({
            title: 'Cheque or Telegraphic Transfer',
            isOnlineGateway: false
          });
        }

        this.autoTopupSetting = <AutoTopupSetting>topupSetting;
        this.stripeCards = striperCards;

        if (isPublic) {
          this.stripeService.initStripeForm('stripeForm');
        }

        setTimeout(() => {
          this.swithGatewayType(this.supportedGatewayTypes[0]);
        }, 0);
      });
  }

  private updateTopupAmount() {
    if (this.selectedGateway) {
      if (!this.topupAmount || this.topupAmount < 2 * this.selectedGateway.minimumAmount) {
        this.topupAmount = 2 * this.selectedGateway.minimumAmount;
      }
    }
  }

  private makeTopupFrom3DSource(sourceId: string): Observable<Payment> {
    return this.stripeService.create3dsResource(sourceId, this.topupAmount, this.wallet.currency).pipe(
      mergeMap(response => {
        if (response.error) {
          Sentry.captureException(response.error);
          return throwError(response.error);
        }

        const source = response.source;
        if (source.status === 'succeeded' || source.status === 'chargeable') {
          return this.makePaymentCall(source.id);
        } else if (source.status === 'failed' || source.status === 'canceled') {
          return throwError({
            code: '3dsAuthenticationFailed',
            source: source,
            message: THREE_DS_AUTHENTICATE_FAILURE_MESSAGE
          });
        } else if (source.status === 'pending') {
          this.stripeAuthenticateUrl = this.sanitizer.bypassSecurityTrustResourceUrl(source.redirect.url);
          this.openStripeAuthenticatePage = true;
          this.stripeAuthenticateLoading = true;
          this.changeDetectorRef.detectChanges();

          setTimeout(() => {
            if (this.stripeAuthenticateLoading) {
              this.stripeAuthenticateLoading = false;
              this.changeDetectorRef.detectChanges();
            }
          }, 1000);

          return this.pollSource(source);
        } else {
          Sentry.captureMessage(`Unknow exception ${source.status}`);

          return throwError(new Error(`Unknow exception ${source.status}`));
        }
      })
    );
  }

  private pollSource(source: any): Observable<Payment> {
    return this.stripeService.retriveSource(source).pipe(
      delay(1000),
      mergeMap(response => {
        if (response.error) {
          this.openStripeAuthenticatePage = false;
          this.changeDetectorRef.detectChanges();
          Sentry.captureException(response.error);
          return throwError(response.error);
        }

        const retrivedSource = response.source;
        if (retrivedSource.status === 'chargeable') {
          this.openStripeAuthenticatePage = false;
          this.changeDetectorRef.detectChanges();

          return this.makePaymentCall(retrivedSource.id);
        } else if (retrivedSource.status !== 'pending') {
          this.openStripeAuthenticatePage = false;
          this.changeDetectorRef.detectChanges();

          return throwError({
            code: '3dsAuthenticationFailed',
            source: retrivedSource,
            message: THREE_DS_AUTHENTICATE_FAILURE_MESSAGE
          });
        } else if (retrivedSource.status === 'pending' && this.openStripeAuthenticatePage) {
          return this.pollSource(source);
        }

        return null;
      })
    );
  }

  private makePaymentCall(token?: string): Observable<Payment> {
    if (this.selectedGateway.isStripe) {
      // only when user input new card with Stripe
      const topupRequest = <StripTopupAndStoreRequest>{
        sourceId: token,
        amount: this.topupAmount,
        currency: this.wallet.currency
      };
      if (this.topupConfig.showAutoTopup && this.enableAutoTopup) {
        topupRequest.enableAutoTopup = this.enableAutoTopup;
      }

      return this.paymentService.stripeTopupAndStoreCard(topupRequest);
    } else {
      const topupRequest = new TopupWithoutLimitationRequest();
      topupRequest.amount = this.topupAmount;
      if (this.topupConfig.showAutoTopup && this.enableAutoTopup) {
        topupRequest.autoTopup = this.enableAutoTopup;
      }
      topupRequest.remark = 'Manually Top-up by customer';

      const gateway = new TopupGateway();
      gateway.code = this.selectedGateway.code;

      let paymentMode = 'STORE';
      if (this.selectedGateway.stored && !this.selectedGateway.isStripe) {
        paymentMode = 'AUTO';
      } else if (this.selectedStripeCard != null && this.selectedGateway.isStripe) {
        // using OTP for stored Stripe when need 2 validate 3ds token
        // AUTO will ignored this feature and using stored token instead
        paymentMode = 'OTP';
      }

      gateway.mode = paymentMode;
      gateway.token = token;
      topupRequest.gateway = gateway;

      return this.paymentService.topupWithoutLimitation(topupRequest);
    }
  }

  private isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
}
