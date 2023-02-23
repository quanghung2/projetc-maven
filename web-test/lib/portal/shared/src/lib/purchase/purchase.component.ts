import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { SellerWallet, SellerWalletService } from '@b3networks/api/billing';
import { Bundle, BundleItem, BundleQuery, BundleService, SubscriptionLicense } from '@b3networks/api/license';
import { NumberService } from '@b3networks/api/number';
import { BillingCycle } from '@b3networks/api/salemodel';
import { GetPriceChangeReq, LinkedSellerService, PriceChain, PricingService } from '@b3networks/api/store';
import { SubscriptionService } from '@b3networks/api/subscription';
import { DestroySubscriberComponent, DomainUtilsService, NUMBER_PRODUCT_ID, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, distinctUntilKeyChanged, filter, finalize, map, takeUntil, tap } from 'rxjs/operators';
import { TopupComponent, TopupInput } from '../topup/topup.component';
import { SkuInfo } from './select-number/select-number.component';

export enum StepName {
  number = 'number',
  checkout = 'checkout',
  addons = 'addons'
}

export interface PurchaseStep {
  id: StepName;
  active: boolean;
  completed: boolean;
}

export interface PurchaseInput {
  bundleId: number;
  id: string;
}

@Component({
  selector: 'psh-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.scss']
})
export class PurchaseComponent extends DestroySubscriberComponent implements OnInit {
  private _bundle: Bundle;
  isLoading: boolean;
  steps: PurchaseStep[] = [];
  activeStep: StepName;
  stepName = StepName;
  bundle$: Observable<Bundle>;

  unitPrice = 0;
  currency: string;

  priceMap: HashMap<PriceChain> = {}; // key is sku

  fg: FormGroup;

  numberSkuMapping: HashMap<SkuInfo> = {};
  reservedAllNumber: boolean;
  wallet: SellerWallet;
  sellerOrgUUid: string;
  autoRenew = true;
  maximumQuantity = 0;
  totalActivationFee = 0;
  hasNumber = false;
  isBundle = false;

  readonly billeds: KeyValue<BillingCycle, string>[] = [
    { key: 'yearly', value: 'Annually' },
    { key: 'monthly', value: 'Monthly' }
  ];

  constructor(
    private routes: ActivatedRoute,
    private bundleQuery: BundleQuery,
    private bundleService: BundleService,
    private domainUtils: DomainUtilsService,
    private pricingService: PricingService,
    private subscriptionService: SubscriptionService,
    private sellerWalletService: SellerWalletService,
    private linkedSellerService: LinkedSellerService,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toastService: ToastService,
    private numberService: NumberService
  ) {
    super();
  }

  ngOnInit(): void {
    this.routes.params.subscribe(params => {
      if (!!params['bundleId']) {
        this.isBundle = true;

        this.bundle$ = this.bundleQuery.selectOne(params['bundleId']).pipe(
          filter(b => b != null),
          distinctUntilKeyChanged('id'),
          takeUntil(this.destroySubscriber$),
          tap(b => {
            this._bundle = b;
            this._bundleChanged();
          })
        );

        this.bundleService
          .getPublic(this.domainUtils.portalDomain)
          .pipe(takeUntil(this.destroySubscriber$))
          .subscribe();
      }
    });

    this.isLoading = true;
    forkJoin([this.linkedSellerService.get(), this.sellerWalletService.getSellers()])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([sellerInfos, sellers]) => {
        const sellerOrgs = sellers.map(uuid => sellerInfos.find(i => i.uuid === uuid)).filter(s => s != null);
        if (sellerOrgs.length) {
          this.sellerOrgUUid = sellerOrgs[0].uuid;
          this.getWallet();
        }
      });
  }

  private getWallet() {
    this.isLoading = true;
    this.sellerWalletService
      .getWallets(this.sellerOrgUUid)
      .pipe(map(res => res[0]))
      .pipe(takeUntil(this.destroySubscriber$))
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(wallet => {
        this.wallet = wallet;
      });
  }

  selectedNumber() {
    this.reservedAllNumber = !Object.keys(this.numberSkuMapping)
      .map(
        numberSku => this.numberSkuMapping[numberSku].selectedNumbers.length === this.numberSkuMapping[numberSku].total
      )
      .includes(false);
  }

  private _bundleChanged() {
    this._initForm();

    const quantityPerBundle = this._bundle.items.map(item => item.quantity).reduce((a, b) => a + b);
    this.maximumQuantity = Math.floor(100 / quantityPerBundle);

    this.steps = [{ id: StepName.checkout, active: false, completed: false }];

    if (this._bundle.numbersItems.length > 0) {
      this.hasNumber = true;
      this.steps.unshift({ id: StepName.number, active: true, completed: false });
      this.activeStep = StepName.number;
    } else {
      const checkOutIndex = this.findStepIndex(StepName.checkout);
      this.steps[checkOutIndex].active = true;
      this.activeStep = StepName.checkout;
    }

    const bundleItems = this._bundle.items;

    const streams = bundleItems.map(i => {
      const req = <GetPriceChangeReq>{ productCode: i.productId, sku: i.sku, saleModel: i.saleModelCode };
      if (!!i.numberSku) {
        req.productCode = NUMBER_PRODUCT_ID;
        req.sku = i.numberSku;
      }

      if (req.sku in this.priceMap) {
        return of(this.priceMap[req.sku]);
      }
      return this.pricingService
        .getPriceChain(req)
        .pipe(takeUntil(this.destroySubscriber$))
        .pipe(
          catchError(_ =>
            of(
              new PriceChain({
                currency: '',
                unitPriceTaxExcl: 0,
                discount: 0,
                effectiveDiscount: 0,
                taxRate: 0,
                productName: '',
                skuName: ''
              })
            )
          ),
          tap(pricing => {
            this.priceMap[req.sku] = pricing;
            if (!this.currency) {
              this.currency = pricing.currency;
            }
          })
        );
    });

    forkJoin(streams)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(_ => {
        this.unitPrice = this._bundle.items
          .map(i => {
            const sku = !!i.numberSku ? i.numberSku : i.sku;
            const amount = this.priceMap[sku].finalPrice;
            return amount * i.quantity;
          })
          .reduce((a, b) => a + b, 0);
      });
  }

  private _initForm() {
    this.fg = this.fb.group({
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(100)]],
      billed: [this._bundle.items[0].saleModelCode, [Validators.required]]
    });
    this.fg.get('billed').disable();

    this.quantity.valueChanges.pipe(takeUntil(this.destroySubscriber$)).subscribe(quantity => {
      Object.keys(this.numberSkuMapping).forEach(numberSku => {
        const numberItem = this._bundle.numbersItems.find(n => n.numberSku === numberSku && n.sku === n.sku);
        this.numberSkuMapping[numberSku].total = numberItem.quantity * quantity;
      });
      this.selectedNumber();
    });

    this._bundle.numbersItems.forEach(n => {
      this.numberSkuMapping[n.numberSku] = <SkuInfo>{
        sku: n.sku,
        numberSku: n.numberSku,
        total: n.quantity * this.quantity.value,
        selectedNumbers: []
      };
    });
  }

  get totalPrice() {
    return Math.round((this.quantity.value * this.unitPrice + this.totalActivationFee) * 100) / 100;
  }

  next() {
    const currentActiveStep = this.steps.findIndex(s => s.active);
    if (currentActiveStep === this.steps.length - 1) {
      // last step
    } else {
      const selectedNumbers = this.numberSkuMapping[Object.keys(this.numberSkuMapping)[0]].selectedNumbers;
      const numbers = selectedNumbers.map(s => s.number);

      if (this.steps[currentActiveStep].id === 'number') {
        forkJoin([
          this.numberService.checkMultiDocument(Object.keys(this.numberSkuMapping), X.orgUuid),
          this.numberService.calcActivationFee(numbers)
        ])
          .pipe(
            tap(([check, fee]) => {
              if (check[0].valid) {
                this.nextStep(currentActiveStep);
                this.totalActivationFee = fee;
              } else {
                this.toastService.warning(`Document of ${check[0].sku} numbers is invalid`);
              }
            })
          )
          .subscribe();
      } else {
        this.nextStep(currentActiveStep);
      }
    }
  }

  nextStep(currentActiveStep: number) {
    this.steps[currentActiveStep].active = false;
    this.steps[currentActiveStep].completed = true;
    this.steps[currentActiveStep + 1].active = true;
    this.activeStep = this.steps[currentActiveStep + 1].id;
    if (this.activeStep === StepName.checkout) {
      // disable change quantity after finish select number
      this.quantity.disable();
    }
  }

  get quantity() {
    return this.fg.get('quantity');
  }

  openTopup() {
    const config: TopupInput = {
      showAutoTopup: true,
      currency: this.currency
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
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(result => {
        if (result?.cancel) {
          return;
        }
        if (result?.error) {
          this.toastService.error(result?.error?.message);
        } else {
          this.getWallet();
        }
      });
  }

  back() {
    const currentActiveStep = this.steps.findIndex(s => s.active);

    if (currentActiveStep === 0) {
      this.cancel();
    } else {
      this.steps[currentActiveStep].active = false;
      this.steps[currentActiveStep].completed = true;
      this.steps[currentActiveStep - 1].active = true;
      this.activeStep = this.steps[currentActiveStep - 1].id;

      if (this.activeStep === StepName.number) {
        this.quantity.enable();
      }
    }
  }

  payment() {
    const items: BundleItem[] = this._bundle.items.map(item => {
      const extensibleObj: BundleItem = {
        productId: item.productId,
        sku: item.sku,
        saleModelCode: item.saleModelCode,
        type: item.type,
        quantity: item.quantity * this.quantity.value,
        autoRenew: this.autoRenew,
        multiplier: 1
      };
      if (item.numberSku) {
        return {
          ...extensibleObj,
          numberProduct: 'number.hoiio',
          numberSku: item.numberSku,
          numbers: this.numberSkuMapping[item.numberSku].selectedNumbers.map(number => number.number)
        };
      }
      return extensibleObj;
    });

    const body: SubscriptionLicense = {
      items: items
    };
    this.isLoading = true;
    this.subscriptionService
      .buySubscribe(body)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(
        _ => this.router.navigate(['purchase', 'success']),
        _ => this.router.navigate(['purchase', 'fail'])
      );
  }

  cancel() {
    this.router.navigate(['']);
  }

  private findStepIndex(id: StepName) {
    return this.steps.findIndex(item => (item.id = id));
  }
}
