import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AppDetailResponse } from '@b3networks/api/app';
import { Organization } from '@b3networks/api/auth';
import { NumberService } from '@b3networks/api/number';
import { PriceModel, SaleModel, SaleModelResponse, SaleModelService, SkuModel } from '@b3networks/api/salemodel';
import { PriceChain, Product, ProductService, Sku, SkuService } from '@b3networks/api/store';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import {
  NumberAddonSkuDetail,
  PurchaseProductSkuModel,
  PurchaseSelectPlan
} from 'libs/api/store/src/lib/purchase/purchase.model';
import { forkJoin } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { SkuInfo } from '../select-number/select-number.component';

class NumberAddonModel {
  productId: string;
  name: string;
  skuDetailList: NumberAddonSkuDetail[];
  selectedSku: NumberAddonSkuDetail;
  saleModelList: SkuModel[];
}

export class NumberVendorModel {
  vendors: NumberAddonModel[] = [];
  selected: NumberAddonModel;
}

@Component({
  selector: 'psh-select-number-product',
  templateUrl: './select-number-product.component.html',
  styleUrls: ['./select-number-product.component.scss']
})
export class SelectNumberProductComponent extends DestroySubscriberComponent implements OnInit {
  @Input() organization: Organization;
  @Input() selectedProduct: AppDetailResponse;
  @Input() purchaseSelectPlan = new PurchaseSelectPlan();
  @Input() numberSkuMapping: HashMap<SkuInfo>;
  @Input() numberVendor = new NumberVendorModel();

  @Output() selectedConfirm = new EventEmitter<HashMap<SkuInfo>>();
  @Output() changeNumberSkuMapping = new EventEmitter<HashMap<SkuInfo>>();
  @Output() changeNumberVendor = new EventEmitter<NumberVendorModel>();

  reservedAllNumber: boolean;
  form: FormGroup;
  loading = true;

  constructor(
    private skuService: SkuService,
    private numberService: NumberService,
    private saleModelService: SaleModelService,
    private fb: FormBuilder,
    private router: Router,
    private productService: ProductService
  ) {
    super();
  }

  initForm() {
    this.form = this.fb.group({
      number: [this.numberVendor.selected.productId],
      country: [this.numberVendor.selected.selectedSku.sku]
    });

    this.form.controls['number'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          this.numberVendor.selected = this.numberVendor.vendors.find(v => v.productId === value);
          this.form.controls['country'].setValue(this.numberVendor.selected.selectedSku.sku);
          this.changeNumberVendor.emit(this.numberVendor);
        })
      )
      .subscribe();

    this.form.controls['country'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          this.skuService
            .getSaleModel(
              this.numberVendor.selected.productId,
              value,
              this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code
            )
            .subscribe((response: PriceChain) => {
              const temp = new PriceChain(response);
              const sku = this.numberVendor.selected.skuDetailList.find(s => s.sku === value);

              this.numberVendor.selected.selectedSku = sku;
              this.numberVendor.selected.selectedSku.price = temp.getRealPrice();
              this.numberSkuMapping = {};
              this.numberSkuMapping[sku.sku] = <SkuInfo>{
                numberSku: sku.sku,
                max: this.purchaseSelectPlan.selectedPlan.maxNumber,
                total: this.purchaseSelectPlan.selectedPlan.quantity,
                selectedNumbers: [],
                name: sku.name,
                price: temp.getRealPrice()
              };
              this.changeNumberSkuMapping.emit(this.numberSkuMapping);
              this.changeNumberVendor.emit(this.numberVendor);
            });
        })
      )
      .subscribe();
  }

  ngOnInit() {
    if (!!this.numberVendor?.selected) {
      this.initForm();
      this.loading = false;
      return;
    }

    this.productService.getProductNumberDetail(this.organization.domain).subscribe(
      (response: Product[]) => {
        if (response.length > 0) {
          const observables = [];
          response.forEach((item: Product) => {
            observables.push(
              this.skuService.fetchSkus(this.organization.domain, { productId: item.productId, filter: '' })
            );
            observables.push(
              this.numberService.getPricingCodes(item.productId, this.getCapability(), 'Available,Reserved')
            );
            observables.push(
              this.saleModelService.getSaleModelDetail(
                this.organization.domain,
                item.productId,
                this.organization.currencyCode
              )
            );
          });
          forkJoin(observables).subscribe(async data => {
            for (let i = 0; i < response.length; i++) {
              const temp = new NumberAddonModel();
              temp.productId = response[i].productId;
              temp.name = response[i].name;
              const tempSkuDetails = <Sku[]>data[3 * i];
              const skuDetails = tempSkuDetails.filter((item: Sku) => {
                return (
                  (<string[]>data[3 * i + 1]).find((temp: string) => {
                    return temp == item.sku;
                  }) != null
                );
              });
              temp.saleModelList = (<SaleModelResponse>data[3 * i + 2]).content;
              temp.skuDetailList = skuDetails.map((item: Sku) => {
                const data = new NumberAddonSkuDetail();
                data.name = item.name;
                data.sku = item.sku;
                const skuPrice = temp.saleModelList.find((skuModel: SkuModel) => {
                  return skuModel.skuCode == item.sku;
                });
                if (skuPrice) {
                  const numberSaleModel = skuPrice.saleModel.find((item: SaleModel) => {
                    return item.code == this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code;
                  });
                  data.price = this.getDomainPrice(numberSaleModel);
                }
                return data;
              });
              if (temp.skuDetailList.length > 0) {
                const selectedCountry = temp.skuDetailList.find((numberCountry: NumberAddonSkuDetail) => {
                  return numberCountry.sku.startsWith(this.organization.billingInfo.countryCode);
                });
                temp.selectedSku = selectedCountry ? selectedCountry : temp.skuDetailList[0];
              }
              if (!!temp.skuDetailList?.length) {
                this.numberVendor.vendors.push(temp);

                if (!this.numberVendor.selected) {
                  this.numberVendor.selected = temp;
                }
              }
            }

            this.purchaseSelectPlan.skuList.forEach((element: PurchaseProductSkuModel) => {
              const skuPrice = this.numberVendor.selected.saleModelList.find((skuModel: SkuModel) => {
                return skuModel.skuCode == this.numberVendor.selected.selectedSku.sku;
              });
              if (skuPrice) {
                const selectedSaleModel = skuPrice.saleModel.find((saleModel: SaleModel) => {
                  return saleModel.code == element.selectedSaleModel.code;
                });
                if (selectedSaleModel) {
                  element.estimatedPrice += selectedSaleModel.domainPrice[0].amount;
                }
              }
            });

            await this.skuService
              .getSaleModel(
                this.numberVendor.selected.productId,
                this.numberVendor.selected.selectedSku.sku,
                this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code
              )
              .toPromise()
              .then((response: PriceChain) => {
                const temp = new PriceChain(response);
                this.numberVendor.selected.selectedSku.price = temp.getRealPrice();

                this.numberSkuMapping[this.numberVendor.vendors[0].selectedSku.sku] = <SkuInfo>{
                  numberSku: this.numberVendor.vendors[0].selectedSku.sku,
                  max: this.purchaseSelectPlan.selectedPlan.maxNumber,
                  total: this.purchaseSelectPlan.selectedPlan.quantity,
                  selectedNumbers: [],
                  name: this.numberVendor.vendors[0].selectedSku.name,
                  price: temp.getRealPrice()
                };
              });

            this.initForm();
            this.changeNumberVendor.emit(this.numberVendor);
            this.loading = false;
          });
        } else {
          this.router.navigate(['purchase', 'step-fail'], {
            state: { msg: 'Sorry, an error has occurred when we try to fulfill your request. Please try again.' }
          });
        }
      },
      error => {
        this.router.navigate(['purchase', 'step-fail'], {
          state: { msg: 'Sorry, an error has occurred when we try to fulfill your request. Please try again.' }
        });
      }
    );
  }

  getDomainPrice(item: SaleModel) {
    if (item) {
      const result = item.domainPrice.find((item: PriceModel) => {
        return item.currency == this.organization.currencyCode;
      });
      return result ? result.amount : 0;
    }
    return 0;
  }

  getCapability() {
    return this.selectedProduct.voiceMode.join(',').toLowerCase();
  }

  selectedNumber() {
    this.selectedConfirm.emit();
  }
}
