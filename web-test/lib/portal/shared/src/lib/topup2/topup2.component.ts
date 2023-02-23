import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatRadioChange } from '@angular/material/radio';
import { SellerWallet } from '@b3networks/api/billing';
import {
  AutoTopupSetting,
  CreatePaymentIntentReq,
  Gateway,
  Payment,
  PaymentService,
  PaymentSettingsService,
  StripeInfo,
  TopupGateway,
  TopupWithoutLimitationRequest
} from '@b3networks/api/payment';
import { LogService } from '@b3networks/api/portal';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, lastValueFrom, Observable } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, finalize } from 'rxjs/operators';

import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { loadStripe, PaymentIntent, Stripe, StripeElements, StripeError } from '@stripe/stripe-js';

export interface Topup2Input {
  wallet: SellerWallet;
  topupAmount?: number;
  showAutoTopup?: boolean;
  onlineOnly?: boolean;
}

declare type MethodType = 'creditCard' | 'cheque';

interface PaymentMethod {
  title: string;
  type: MethodType;
}

declare type TopupStep = 'inputAmount' | 'checkout';

@Component({
  selector: 'b3n-topup2',
  templateUrl: './topup2.component.html',
  styleUrls: ['./topup2.component.scss'],
  animations: [
    trigger('openStoreCard', [
      state('true', style({ opacity: 1 })),
      transition('void => *', [style({ opacity: 0 }), animate(500)])
    ])
  ]
})
export class Topup2Component implements OnInit {
  supportedPaymentMethods: PaymentMethod[] = [{ title: 'Credit Card', type: 'creditCard' }];

  topupFG: FormGroup;
  toupStep: TopupStep = 'inputAmount';

  wallet: SellerWallet;
  gateways: Gateway[] = [];
  autoTopupSetting: AutoTopupSetting;

  selectedGateway: Gateway;
  stripeInfo: StripeInfo;
  topupCreditFee: number;

  hasStripeGW = false;
  showAutoTopup = true;
  hasStoredGateway = false;
  useStoredCard = false;
  loading: boolean;
  progressing: boolean;

  // Stripe checkout
  stripe: Stripe;
  stripeElements: StripeElements;

  _amountIntenntMap: { [key: number]: string } = {}; // keep track mappping between topup amount with secrect_client

  get amountFC() {
    return this.topupFG.get('amount') as FormControl;
  }

  get enableAutoTopupFC() {
    return this.topupFG.get('enableAutoTopup') as FormControl;
  }

  get lowerLitmitForAutoTopup() {
    if (this.topupFG.get('amount').value) {
      const threshold = this.selectedGateway.settings.threshold || 0;
      return Math.round(this.topupFG.get('amount').value * threshold * 1000) / 1000;
    } else {
      return 0;
    }
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: Topup2Input,

    private dialogRef: MatDialogRef<Topup2Component>,
    private paymentService: PaymentService,
    private paymentSettingsSevice: PaymentSettingsService,
    private toastr: ToastService,
    private logService: LogService,
    private fb: FormBuilder
  ) {
    this.wallet = this.data.wallet;
    this.showAutoTopup = this.data.showAutoTopup;

    if (this.wallet.postpaid && this.wallet.balance > 0) {
      this.data.topupAmount = this.wallet.balance;
    }

    this.paymentSettingsSevice.getDomainGatewaySettings('stripe').subscribe(async settings => {
      if (settings) {
        this.stripe = await loadStripe(settings.publicKey);
      }
    });

    this._initForm();
  }

  ngOnInit(): void {
    this._initData();
  }

  selectedGatewayChange(event: MatRadioChange) {
    const gateway: Gateway = this.gateways.find(gateways => gateways.code === event.value);
    this._swithGateway(gateway);
  }

  switch2NewCreditCard() {
    this.selectedGateway = this.gateways.find(g => g.isStripe);
    this.useStoredCard = false;
  }

  switch2StoredCreditCard() {
    this.selectedGateway = this.gateways.find(g => g.isOnlineGateway && g.stored);
    this.useStoredCard = true;
  }

  goback() {
    if (this.toupStep === 'checkout') {
      this.toupStep = 'inputAmount';
      this.topupFG.enable();
    }
  }

  async proceed() {
    if (this.toupStep === 'inputAmount') {
      this.toupStep = 'checkout';
      this.topupFG.disable();
      await this._buildCheckoutRegion('From procee event');
      return;
    }

    // toupup action
    const { amount } = this.topupFG.getRawValue();
    if (!amount || (this.selectedGateway.adminFeeThreshold === null && amount < this.selectedGateway.minimumAmount)) {
      this.toastr.warning(
        `Invalid topup amount. Please topup with amount don't less than ${this.selectedGateway.minimumAmount}` +
          ` ${this.wallet.currency}.`
      );
      return;
    }

    this._stripeTopup();
  }

  private async _stripeTopup() {
    this.progressing = true;

    const result: { payment?: Payment; paymentIntent: PaymentIntent; error: StripeError } = {
      paymentIntent: null,
      payment: null,
      error: null
    };
    if (!this.selectedGateway.isOnlineGateway || !this.selectedGateway.isStripe) {
      try {
        result.payment = await lastValueFrom(this._topupWithCheque());
      } catch (e) {
        result.error = <StripeError>{ message: e['message'] };
      }
    } else {
      let r;

      if (this.useStoredCard && this.stripeInfo.paymentMethod) {
        const clientSecret = this._amountIntenntMap[this._paymentIntentKey];

        r = await this.stripe.confirmCardPayment(clientSecret, {
          payment_method: this.stripeInfo.paymentMethod
        });
      } else {
        r = await this.stripe.confirmPayment({
          elements: this.stripeElements,
          confirmParams: {
            return_url: location.href
          },
          redirect: 'if_required'
        });
      }

      result.paymentIntent = r.paymentIntent;
      result.error = r.error;
    }

    this.progressing = false;

    if (result.error == null) {
      this.dialogRef.close(result);
    } else if (result.error) {
      this.logService.logPaymentError(result.error).subscribe();
      this.dialogRef.close({ error: result.error });
    }
  }

  private _initForm() {
    this.topupFG = this.fb.group({
      amount: this.fb.control(this.data.topupAmount, [Validators.required]),
      paymentMethod: this.fb.control(this.supportedPaymentMethods[0].type, [Validators.required]),
      enableAutoTopup: [true]
    });

    this.amountFC.valueChanges.pipe(debounceTime(300), distinctUntilChanged()).subscribe(async value => {
      console.log(`amount change ${value}`);

      if (this._isValidTopupAmount && this.toupStep === 'checkout') {
        await this._buildCheckoutRegion('From amount changed');
      }
    });

    this.topupFG
      .get('paymentMethod')
      .valueChanges.pipe(
        distinctUntilChanged(),
        filter(_ => !this.topupFG.disabled)
      )
      .subscribe(gwType => {
        gwType = gwType as MethodType;
        this._swithPaymentMethod(gwType);
      });
  }

  private async _buildCheckoutRegion(callfrom?: string) {
    if (!this.hasStripeGW) {
      return;
    }

    console.log(`_buildCheckoutRegion: ${callfrom}`);

    let clientSecret = this._amountIntenntMap[this._paymentIntentKey];
    if (!clientSecret) {
      const { amount, enableAutoTopup } = this.topupFG.getRawValue();
      const payload = <CreatePaymentIntentReq>{
        amount: amount,
        currency: this.wallet.currency,
        sellerUuid: this.wallet.sellerUuid
      };
      if (this.showAutoTopup) {
        payload.enableAutoTopup = enableAutoTopup;
      }
      const result = await lastValueFrom(this.paymentService.createPaymentIntent(payload));

      this._amountIntenntMap[this._paymentIntentKey] = result.clientSecret;
      clientSecret = this._amountIntenntMap[this._paymentIntentKey];
    }

    this.stripeElements = this.stripe.elements({
      clientSecret: clientSecret
    });

    setTimeout(() => {
      const paymentEl = this.stripeElements.create('payment');
      paymentEl.mount('#payment-element');
    });

    return;
  }

  // each payment intent should be identifier by amount and autoTopupConfig
  private get _paymentIntentKey() {
    const { amount, enableAutoTopup } = this.topupFG.getRawValue();
    return `${amount}-${enableAutoTopup}`;
  }

  private _initData() {
    this.loading = true;

    forkJoin([
      this.paymentService.getGateways('TOPUP'),
      this.paymentService.getSettings(),
      this.paymentService.getStripeInfoV4(this.wallet.sellerUuid, this.wallet.currency)
    ])
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(([gateways, setting, stripeInfo]) => {
        this.stripeInfo = stripeInfo;
        const stripeGW = gateways.find(g => g.isStripe);
        this.hasStripeGW = stripeGW != null;
        if (stripeGW && stripeInfo?.adminFee) {
          stripeGW.adminFeeThreshold = stripeInfo.adminFee?.threshold;
          this.topupCreditFee = stripeInfo.adminFee?.amount;
        }

        this.gateways = gateways;
        this.gateways.sort((a, b) => (a.code < b.code ? 1 : a.code > b.code ? -1 : 0));
        this.hasStoredGateway = this.gateways.some(g => g.stored);
        this.useStoredCard = this.hasStoredGateway;

        if (this.gateways.some(g => g.isOfflineGateway) && !this.data.onlineOnly) {
          this.supportedPaymentMethods.push({
            title: 'Cheque or Telegraphic Transfer',
            type: 'cheque'
          });
        }

        this.autoTopupSetting = setting;

        this._swithPaymentMethod(this.supportedPaymentMethods[0].type);
      });
  }

  private _topupWithCheque(): Observable<Payment> {
    const { amount, enableAutoTopup } = this.topupFG.getRawValue();
    const topupRequest = new TopupWithoutLimitationRequest();
    topupRequest.amount = amount;
    if (this.showAutoTopup) {
      topupRequest.autoTopup = enableAutoTopup;
    }
    topupRequest.remark = 'Manually Top-up by customer';

    const gateway = new TopupGateway();
    gateway.code = this.selectedGateway.code;

    let paymentMode = 'STORE';
    if (this.selectedGateway.stored) {
      paymentMode = 'AUTO';
    }

    gateway.mode = paymentMode;
    topupRequest.gateway = gateway;

    return this.paymentService.topupWithoutLimitation(topupRequest);
  }

  private _swithPaymentMethod(method: MethodType) {
    console.log(`_swithPaymentMethod: `, method);
    if (this.topupFG.disabled) {
      return;
    }

    let gateway;
    if (method === 'cheque') {
      gateway = this.gateways.find(g => g.isOfflineGateway);
    } else if (this.autoTopupSetting.gatewayCode) {
      gateway = this.gateways.find(g => g.code === this.autoTopupSetting.gatewayCode && g.isOnlineGateway && g.stored);
      if (!gateway) {
        gateway = this.gateways.find(g => g.isOnlineGateway && g.stored);
      }
    } else {
      gateway = this.gateways.find(g => g.isOnlineGateway && g.stored);
    }

    this._swithGateway(gateway);
  }

  private _swithGateway(gateway: Gateway) {
    if (gateway) {
      this.selectedGateway = gateway;
    } else {
      // using new card with stripe
      this.selectedGateway = this.gateways.find(g => g.isStripe);
      this.hasStoredGateway = this.selectedGateway.stored;
      this.enableAutoTopupFC.setValue(true);
    }

    this._updateTopupAmount();

    if (this.selectedGateway.stored) {
      this.hasStoredGateway = true;
    } else {
      this.hasStoredGateway = false;
      this.enableAutoTopupFC.setValue(true);
    }
  }

  private _updateTopupAmount() {
    if (this.selectedGateway) {
      const amount = this.amountFC.value;
      const valuableAmount = 2 * this.selectedGateway.minimumAmount;
      if (!amount || amount < valuableAmount) {
        this.amountFC.setValue(valuableAmount);
      }
    }
  }

  get _isValidTopupAmount() {
    const amount = this.amountFC.value;
    return amount >= this.selectedGateway.minimumAmount;
  }
}
