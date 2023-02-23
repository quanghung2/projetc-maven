import { CurrencyPipe } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AppQuery, AppService, AppSku, GetV3AppReq } from '@b3networks/api/app';
import { Bundle, BundleItem, BundleService, LicenseService } from '@b3networks/api/license';
import { NumberService } from '@b3networks/api/number';
import { SkuPrice, SkuPriceService } from '@b3networks/api/salemodel';
import { Product, ProductService, Sku, SkuService, TypeProduct } from '@b3networks/api/store';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { BehaviorSubject, combineLatest, firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { debounceTime, finalize, map, startWith, switchMap, tap } from 'rxjs/operators';

export interface StoreBundleInput {
  bundle?: Bundle;
}

@Component({
  selector: 'b3n-store-bundle',
  templateUrl: './store-bundle.component.html',
  styleUrls: ['./store-bundle.component.scss'],
  providers: [CurrencyPipe]
})
export class StoreBundleComponent implements OnInit {
  ctaTitle: string;
  ctaButton: 'Create' | 'Update';

  products: Product[];
  productsFilter: Product[] = [];
  numberProducts: Product[] = [];
  changeNumberSkus$ = new BehaviorSubject<boolean>(true);

  skuMap: HashMap<AppSku[]> = {}; // key is productId + _base|_addon|_number
  saleModelMap: HashMap<SkuPrice[]> = {}; //key is sku ID + saleModel
  addonConfigMap: HashMap<HashMap<number>> = {}; // key is base sku ID

  hasMonthly: boolean;
  hasYearly: boolean;
  hasOneOff: boolean;

  bundleFG: UntypedFormGroup;

  numberItem: AppSku;
  numberSkus: Sku[];
  filteredNumberSkus$: Observable<Sku[]>;

  searchNumberCtr: UntypedFormControl;
  selectedNumberSku: Sku;

  summaryHtml: string;

  addonErrorMessage: string;
  progressing: boolean;
  productTypes: TypeProduct[] = [];

  @ViewChild('formEle') formEle: ElementRef;
  @ViewChild('searchNumberCountryInp') searchNumberCountryInp: ElementRef;

  get addonsFA() {
    return this.bundleFG.get('addons') as UntypedFormArray;
  }

  get numbersFA() {
    return this.bundleFG.get('numbers') as UntypedFormArray;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: StoreBundleInput,
    private fb: UntypedFormBuilder,
    private appQuery: AppQuery,
    private appService: AppService,
    private productService: ProductService,
    private skuService: SkuService,
    private skuPriceService: SkuPriceService,
    private licenseService: LicenseService,
    private numberService: NumberService,
    private bundleService: BundleService,
    private toastr: ToastService,
    private dialogRef: MatDialogRef<StoreBundleComponent>,
    private currencyPipe: CurrencyPipe
  ) {
    this.ctaTitle = !this.data.bundle ? 'Create bundle' : 'Update bundle';
    this.ctaButton = !this.data.bundle ? 'Create' : 'Update';
    this.initForm();
  }

  ngOnInit(): void {
    forkJoin([this.productService.fetchTypes(), this.productService.geAvailableProducts()]).subscribe(
      async ([productTypes, products]) => {
        this.productTypes = productTypes;
        this.products = products;

        if (this.data.bundle) {
          this.initUpdatingBunleData();
        }
      }
    );
  }

  async typeChanged(productType: TypeProduct) {
    this.hasMonthly = false;
    this.hasYearly = false;
    this.hasOneOff = false;
    this.bundleFG.get('saleModel').setValue(this.data.bundle?.items[0].saleModelCode || 'monthly');

    if (productType.type === 'APP') {
      const apps = await firstValueFrom(
        this.appService.getV3Apps(<GetV3AppReq>{ features: ['license'], includeSku: true, includeFeature: true })
      );
      const appIds = apps.map(a => a.id);
      this.productsFilter = this.products.filter(p => appIds.indexOf(p.productId) > -1).filter(p => p != null);
      this.numberProducts = this.products.filter(p => p.type === 'NUMBER');
      this.bundleFG.controls['numberProduct'].enable();

      if (this.numberProducts.length) {
        this.bundleFG.get('numberProduct').setValue(this.numberProducts[0].productId);
      }
    } else {
      this.numberProducts = [];
      this.productsFilter = this.products.filter(p => p.type === productType.type);
      this.bundleFG.controls['numberProduct'].disable();
    }

    this.skuMap = {};
    this.numberItem = null;
    this.bundleFG.get('product').reset();
    this.bundleFG.get('base').reset();
    this.bundleFG.get('enabledNumber').setValue(false);
    this.addonsFA.clear();
    this.numbersFA.clear();
  }

  numberProductChanged() {
    const sku = this.bundleFG.get('base').value;
    this.numberSkus = null;

    if (sku) {
      this.baseSkuChanged(sku);
    }
  }

  async productChanged(product: Product) {
    this.bundleFG.get('base').reset();
    const productId = product.productId;

    if (!this.skuMap[productId + '_base']) {
      const skus = await this.skuService.getProductSkus(productId).toPromise();
      const publishedSkuIDs = skus.filter(i => i.isPublished).map(i => i.sku);
      const app = this.appQuery.getEntity(productId);
      let appSkus = app?.skus || [];
      const publishedSkus = appSkus.filter(sku => publishedSkuIDs.indexOf(sku.id) > -1);

      // setup config
      if (product.isApp) {
        this.skuMap[productId + '_base'] = publishedSkus
          .filter(s => s.skuType === 'base')
          .sort((a, b) => a.name.localeCompare(b.name));
        this.skuMap[productId + '_addon'] = publishedSkus
          .filter(s => s.skuType === 'addon' && !s.isNumber)
          .sort((a, b) => a.name.localeCompare(b.name));
        this.skuMap[productId + '_number'] = publishedSkus.filter(s => s.isNumber);
      } else {
        appSkus = skus
          .filter(s => s.isPrimary)
          .map(s => new AppSku({ features: [{ code: 'license_base' }], name: s.name, id: s.sku }))
          .sort((a, b) => a.name.localeCompare(b.name));

        this.skuMap[productId + '_base'] = appSkus;
      }

      // fetch all pricing to check later
      const streams = (product.isApp ? publishedSkus : appSkus).map(s =>
        this.skuPriceService.getProductSkuPrices(productId, s.id).pipe(
          tap(pricings => {
            const pricingsNonBlocked = pricings.filter(p => !p.isBlocked);
            this.saleModelMap[s.id] = pricingsNonBlocked;

            if (!pricingsNonBlocked.length) {
              this.skuMap[productId + '_base'] = appSkus.filter(appSku => appSku.id !== s.id);
            }
          })
        )
      );
      await forkJoin(streams).toPromise();
    }
  }

  baseSkuChanged(sku: AppSku) {
    const saleModels = (this.saleModelMap[sku.id] || []).map(s => s.saleModel);
    const saleModelFC = this.bundleFG.get('saleModel');

    this.hasMonthly = saleModels.includes('monthly');
    this.hasYearly = saleModels.includes('yearly');
    this.hasOneOff = saleModels.includes('one_off');

    if (!this.hasMonthly && saleModelFC.value === 'monthly') {
      saleModelFC.setValue(this.hasYearly ? 'yearly' : 'one_off');
    } else if (!this.hasYearly && saleModelFC.value === 'yearly') {
      saleModelFC.setValue(this.hasMonthly ? 'monthly' : 'one_off');
    } else if (!this.hasOneOff && saleModelFC.value === 'one_off') {
      saleModelFC.setValue(this.hasMonthly ? 'monthly' : 'yearly');
    }

    of(this.addonConfigMap[sku.id])
      .pipe(switchMap(config => (config != null ? of(config) : this.licenseService.getMappingConfig(sku.id))))
      .subscribe(config => {
        this.addonConfigMap[sku.id] = config;

        // preconfig base and number items
        const productId = (this.bundleFG.get('product').value as Product).productId;
        const availableAddonSkus = Object.keys(config);

        this.addonsFA.clear();
        (this.skuMap[productId + '_addon'] ?? [])
          .filter(s => availableAddonSkus.indexOf(s.id) > -1)
          .forEach(s => {
            const selected = this.data.bundle?.items.findIndex(i => i.sku === s.id) > -1;
            const addon = this.data.bundle?.items.find(i => i.sku === s.id);

            this.addonsFA.push(
              this.fb.group({
                sku: s.id,
                skuName: [s.name],
                quantity: [addon ? addon.quantity : 1],
                selected: [selected]
              })
            );
          });

        this.numberItem = (this.skuMap[productId + '_number'] ?? []).find(s => availableAddonSkus.indexOf(s.id) > -1);
        if (this.numberItem) {
          of(this.numberSkus)
            .pipe(
              switchMap(numbers =>
                !numbers
                  ? forkJoin([
                      this.skuService.getProductSkus(this.bundleFG.get('numberProduct').value),
                      this.numberService.getSkus(this.bundleFG.get('numberProduct').value)
                    ]).pipe(map(([skus, b3numbers]) => skus.filter(s => b3numbers.indexOf(s.sku) > -1)))
                  : of(numbers)
              )
            )
            .subscribe(numbers => {
              this.numberSkus = numbers;
              this.changeNumberSkus$.next(true);
              const numberAddons = this.data.bundle?.items.filter(a => !!a.numberSku) || [];
              this.numbersFA.clear();
              if (numberAddons.length) {
                this.bundleFG.controls['enabledNumber'].setValue(true);
                numberAddons.forEach(addon => {
                  const numberSkuIndex = this.numberSkus.findIndex(n => n.sku === addon.numberSku);
                  const numberSku = this.numberSkus[numberSkuIndex];

                  if (!numberSku) {
                    return;
                  }

                  this.numbersFA.push(
                    this.fb.group({
                      sku: addon.numberSku,
                      skuName: [numberSku?.name],
                      quantity: [addon.quantity],
                      selected: [true]
                    })
                  );
                });

                forkJoin(
                  numberAddons.map(n => {
                    return this.skuPriceService
                      .getProductSkuPrices(this.bundleFG.get('numberProduct').value, n.numberSku)
                      .pipe(tap(prices => (this.saleModelMap[n.numberSku] = prices)));
                  })
                ).subscribe();
              }
            });
        }
      });
  }

  addNumber() {
    if (this.selectedNumberSku) {
      this.numbersFA.push(
        this.fb.group({
          sku: this.selectedNumberSku.sku,
          skuName: [this.selectedNumberSku.name],
          quantity: [1],
          selected: [true]
        })
      );

      const sku = this.selectedNumberSku.sku;
      this.skuPriceService.getProductSkuPrices(this.bundleFG.get('numberProduct').value, sku).subscribe(prices => {
        this.saleModelMap[sku] = prices.filter(p => !p.isBlocked);
      });

      this.selectedNumberSku = null;
      this.searchNumberCtr.setValue('');

      setTimeout(() => {
        this.formEle.nativeElement.scrollTop = this.formEle.nativeElement.scrollHeight;
      }, 0);
    }
  }

  process() {
    const validated = this.validate();
    if (!validated) {
      return;
    }

    this.progressing = true;

    const data = this.bundleFG.value;

    const baseItem = <BundleItem>{
      productId: data.product.productId,
      saleModelCode: data.saleModel
    };
    const items: BundleItem[] = [
      <BundleItem>{
        ...baseItem,
        sku: data.base.id,
        quantity: 1
      }
    ];

    data.addons
      .filter(a => a.selected)
      .forEach(addon => {
        items.push(<BundleItem>{
          ...baseItem,
          sku: addon.sku,
          quantity: addon.quantity
        });
      });

    if (this.numberItem && data.enabledNumber) {
      data.numbers
        .filter(a => a.selected)
        .forEach(addon => {
          items.push(<BundleItem>{
            ...baseItem,
            sku: this.numberItem.id,
            numberSku: addon.sku,
            quantity: addon.quantity,
            numberProduct: this.bundleFG.get('numberProduct').value
          });
        });
    }
    const req = <Bundle>{
      name: data.name,
      description: data.description,
      items: items,
      published: data.published
    };

    of(this.data.bundle)
      .pipe(switchMap(bundle => (bundle ? this.bundleService.update(bundle.id, req) : this.bundleService.create(req))))
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        value => {
          this.toastr.success(`${this.data.bundle ? 'Update' : 'Create'} bundle ${req.name} successfully`);
          this.dialogRef.close(value);
        },
        error => {
          this.toastr.warning(error.message);
        }
      );
  }

  skuDisplay(item: Sku) {
    return item?.name;
  }

  private validate() {
    const data = this.bundleFG.value;
    const config = this.addonConfigMap[data.base.id] || {};
    const errorMessages = [];

    const addons = data.addons.filter(a => a.selected);
    addons.forEach(addon => {
      if (addon.quantity > config[addon.sku]) {
        errorMessages.push(
          `<li>The maximum quota quantity of <strong>${addon.skuName}</strong> should be ${config[addon.sku]}</li>`
        );
      } else if (!addon.quantity) {
        errorMessages.push(`<li>The minimum quota quantity of <strong>${addon.skuName}</strong> should be 1</li>`);
      }
      if (!this.saleModelMap[addon.sku].map(s => s.saleModel).includes(data.saleModel)) {
        errorMessages.push(`<li><strong>${addon.skuName}</strong> does not support the ${data.saleModel} pricing</li>`);
      }
    });
    if (this.numberItem && data.enabledNumber) {
      const numbers = data.numbers.filter(n => n.selected);
      const reservedNumberCount = numbers.map(n => n.quantity).reduce((n1, n2) => n1 + n2, 0);
      if (reservedNumberCount > config[this.numberItem.id]) {
        errorMessages.push(
          `<li>The maximum quota quantity of <strong>${this.numberItem.name}</strong> should be  ${
            config[this.numberItem.id]
          }</li>`
        );
      } else if (!reservedNumberCount) {
        errorMessages.push(
          `<li>The minimum quota quantity of <strong>${this.numberItem.name}</strong> should be 1</li>`
        );
      }
      if (!this.saleModelMap[this.numberItem.id].map(s => s.saleModel).includes(data.saleModel)) {
        errorMessages.push(
          `<li><strong>${this.numberItem.name}</strong> does not support the ${data.saleModel} pricing</li>`
        );
      }
      numbers.forEach(number => {
        if (!number.quantity) {
          errorMessages.push(
            `<li>The minimum quota quantity of <strong>${this.numberItem.name} - ${number.skuName}</strong> should be 1</li>`
          );
        }
      });
    }
    this.addonErrorMessage = errorMessages.join('\n');

    return !errorMessages.length;
  }

  private async initUpdatingBunleData() {
    const product = this.products.find(p => p.productId === this.data.bundle.items[0].productId);
    const type = this.productTypes.find(p => p.type === product.type);
    this.bundleFG.controls['type'].setValue(type);
    await this.typeChanged(type);

    if (product) {
      this.bundleFG.controls['product'].setValue(product);
      await this.productChanged(product);

      let baseSku: AppSku;

      if (type.type === 'APP') {
        const baseSkuId = this.data.bundle.items.find(i => i.type === 'BASE').sku;
        baseSku = this.skuMap[product.productId + '_base'].find(s => s.id === baseSkuId);
      } else {
        baseSku = this.skuMap[product.productId + '_base'][0];
      }

      this.bundleFG.controls['base'].setValue(baseSku);

      const numberItem = this.data.bundle.items.find(i => !!i.numberProduct || !!i.numberSku);

      if (numberItem) {
        const numberProduct = numberItem.numberProduct;

        if (numberProduct) {
          this.bundleFG.controls['numberProduct'].setValue(numberProduct);
        }

        if (!numberProduct && this.numberProducts.length) {
          this.bundleFG.controls['numberProduct'].setValue(this.numberProducts[0].productId);
        }
      }

      this.baseSkuChanged(baseSku);
    }
  }

  private initForm() {
    const salemodel = this.data.bundle?.items[0].saleModelCode || 'monthly';
    this.bundleFG = this.fb.group({
      type: [null],
      name: [this.data.bundle?.name, [Validators.required]],
      description: this.fb.control(this.data.bundle?.description),
      saleModel: [salemodel, [Validators.required]],
      product: [null, [Validators.required]],
      base: [null, [Validators.required]],
      addons: this.fb.array([]),
      enabledNumber: [false],
      numbers: this.fb.array([]),
      published: [this.data.bundle?.published],
      numberProduct: ['', [Validators.required]]
    });

    this.buildSummary(this.bundleFG.value);

    this.bundleFG.valueChanges.pipe(debounceTime(200)).subscribe(bundle => {
      this.buildSummary(bundle);
    });

    this.searchNumberCtr = new UntypedFormControl();
    this.filteredNumberSkus$ = combineLatest([
      this.changeNumberSkus$,
      this.searchNumberCtr.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([_, value]) => value),
      map(value => {
        if (value instanceof Sku || value == null) {
          this.selectedNumberSku = value;
          return this.numberSkus;
        } else {
          return (this.numberSkus || []).filter(s => s.name.toLowerCase().includes(String(value).toLowerCase()));
        }
      })
    );
  }

  private getSaleModelLabel(saleModel: string) {
    switch (saleModel) {
      case 'monthly':
        return 'Monthly Recurring Charge';
      case 'yearly':
        return 'Annual Recurring Charge';
      case 'one_off':
        return 'One Time Charge';
      default:
        return '';
    }
  }

  private buildSummary(bundle: HashMap<any>) {
    let totalPrice: SkuPrice;
    const basePrice = this.getSkuPrice(bundle['base']?.id, bundle['saleModel']);
    if (basePrice) {
      totalPrice = new SkuPrice(basePrice);
    }
    const summaryRows = [
      this.buildSummaryRow('Name', bundle['name']),
      this.buildSummaryRow('Description', bundle['description']),
      this.buildRowWithPricing(
        'Base license',
        bundle['base']?.name,
        this.getSkuPrice(bundle['base']?.id, bundle['saleModel'])
      ), // base sku use AppSKu
      this.buildSummaryRow('Sale model', this.getSaleModelLabel(bundle['saleModel'])) // base sku use AppSKu
    ];

    const addonRows = [];
    const addons = (bundle['addons'] || []).filter(a => a.selected);
    if (!addons.length) {
      addonRows.push(`<div class="text-center help-text">Not available</div>`);
    } else {
      addons.forEach(a => {
        const price = this.getSkuPrice(a.sku, bundle['saleModel']);
        if (price) {
          totalPrice.amount += price.amount * a.quantity;
        }
        addonRows.push(
          `<li class="py-8"><div class="d-flex"><span class="text-truncate spacer">${
            a.skuName
          }</span> <span class="ml-8 teal-fg d-content-width">${a.quantity} ${
            price ? ' x ' + this.currencyPipe.transform(price.amount, price.currency) : ''
          } </span></div></li>`
        );
      });
    }

    summaryRows.push(
      `<div class="container-fluid">`,
      `<div class="secondary-text pb-8">Addon licenses</div>`,
      `<ul class="container-fluid px-16 pr-0">${addonRows.join('\n')}</ul>`,
      `</div>`
    );

    if (this.numberItem) {
      const numbersRows = [];
      const numbers = (bundle['numbers'] || []).filter(n => n.selected);
      if (bundle['enabledNumber'] && numbers.length) {
        numbers.forEach(n => {
          const price = this.getSkuPrice(n.sku, bundle['saleModel']);
          if (price) {
            totalPrice.amount += price.amount * n.quantity;
          }
          numbersRows.push(
            `<li class="py-8"><div class="d-flex"><span class="text-truncate spacer">${
              n.skuName
            }</span> <span class="ml-8 teal-fg d-content-width">${n.quantity} ${
              price ? ' x ' + this.currencyPipe.transform(price.amount, price.currency) : ''
            }</span></div></li>`
          );
        });
      } else {
        numbersRows.push(`<div class="text-center help-text">Not available</div>`);
      }

      summaryRows.push(
        `<div class="container-fluid">`,
        `<div class="secondary-text pb-8">${this.numberItem.name}</div>`,
        `<ul class="container-fluid px-16 pr-0">${numbersRows.join('\n')}</ul>`,
        `</div>`
      );
    }

    summaryRows.push(
      `<div class="border-top container-fluid"></div>`,
      this.buildRowWithPricing(null, `Total`, totalPrice)
    );

    this.summaryHtml = summaryRows.join('\n');
  }

  private buildSummaryRow(label, value: string, price?: SkuPrice) {
    return [
      `<div class="container-fluid">${label ? '<div class="secondary-text pb-8">' + label + ':</div>' : ''}`,
      `<div class="d-flex container-fluid"><strong class="spacer">${value || 'N/A'}</strong>`,
      price ? `<span class="teal-fg">${this.currencyPipe.transform(price.amount, price.currency)}</span>` : '',
      `</div></div>`
    ].join('\n');
  }

  private buildRowWithPricing(label, value: string, price: SkuPrice) {
    return [
      `<div class="container-fluid">${label ? '<div class="secondary-text pb-8">' + label + ':</div>' : ''}`,
      `<div class="d-flex container-fluid"><strong class="spacer">${value || 'N/A'}</strong>`,
      `<span class="teal-fg">${price ? this.currencyPipe.transform(price.amount, price.currency) : 'NA'}</span>`,
      `</div></div>`
    ].join('\n');
  }

  private getSkuPrice(sku, saleModel: string): SkuPrice | null {
    return this.saleModelMap[sku]?.find(s => s.saleModel === saleModel);
  }
}
