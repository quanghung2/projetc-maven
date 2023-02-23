import { KeyValue, Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { AppDetailResponse, AppService, SkuDetail } from '@b3networks/api/app';
import { IdentityProfileQuery, IdentityProfileService, Organization, OrganizationService } from '@b3networks/api/auth';
import { SellerWallet, SellerWalletService } from '@b3networks/api/billing';
import { BundleItem, SubscriptionLicense } from '@b3networks/api/license';
import {
  AssignNumberData,
  AssignNumberRequest,
  NumberQuery,
  NumberService,
  ReserveNumberData,
  ReserveNumberDuration,
  ReserveNumberRequest
} from '@b3networks/api/number';
import { OrderItem, OrderRequest, OrderService } from '@b3networks/api/order';
import { PortalConfigService } from '@b3networks/api/partner';
import {
  BillingCycle,
  PriceModel,
  SaleModel,
  SaleModelResponse,
  SaleModelService,
  SkuModel
} from '@b3networks/api/salemodel';
import {
  EstimatedPriceService,
  GetCostStoreBySkusRequest,
  LinkedSellerService,
  PriceChain,
  Product,
  ProductService,
  Sku,
  SkuService
} from '@b3networks/api/store';
import {
  PurchaseSubscriptionRequest,
  SkuSubscription,
  SubscribedProductService,
  SubscriptionService as LicenseSubscriptionService
} from '@b3networks/api/subscription';
import { PurchaseStep, StepName, Topup2Component, Topup2Input } from '@b3networks/portal/shared';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import {
  PurchaseAddonModel,
  PurchaseProductSkuModel,
  PurchaseProductSkuSaleModel,
  PurchaseSelectPlan,
  SkuAddonModel
} from 'libs/api/store/src/lib/purchase/purchase.model';
import { cloneDeep } from 'lodash';
import { firstValueFrom, forkJoin, Observable } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';
import { NumberVendorModel } from '../select-number-product/select-number-product.component';
import { SkuInfo } from '../select-number/select-number.component';

const NUMBER_SKU_CODE = '78f90911-e6ef-4c79-afaa-f554fd20f9c5';

@Component({
  selector: 'psh-purchase-product',
  templateUrl: './purchase-product.component.html',
  styleUrls: ['./purchase-product.component.scss']
})
export class PurchaseProductComponent extends DestroySubscriberComponent implements OnInit {
  sellerOrgUUid: string;
  wallet: SellerWallet;
  steps: PurchaseStep[] = [];
  activeStep: StepName;
  stepName = StepName;
  currency: string;
  numberSkuMapping: HashMap<SkuInfo> = {};
  type: string;
  organization: Organization;
  purchaseSelectPlan = new PurchaseSelectPlan();
  product: AppDetailResponse;
  hardwareProduct: Product;
  loadingPM = true;
  formPM: FormGroup;
  selectedAddon = new PurchaseAddonModel();
  skus: SkuAddonModel[];
  reservedAllNumber: boolean;
  autoRenew = true;
  numberVendor = new NumberVendorModel();
  trial = false;
  displayedColumns: string[] = ['name', 'details'];
  dataSource: MatTableDataSource<PurchaseProductSkuModel>;
  hardwareDataSource: MatTableDataSource<Sku>;
  hardwareQuantityHash: HashMap<number> = {};
  totalActivationFee = 0;
  hasNumber = false;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  readonly KEYS = Object.keys;

  readonly billeds: KeyValue<BillingCycle, string>[] = [
    { key: 'yearly', value: 'Annually' },
    { key: 'monthly', value: 'Monthly' },
    { key: 'one_off', value: 'One Off' }
  ];

  constructor(
    private routes: ActivatedRoute,
    private sellerWalletService: SellerWalletService,
    private linkedSellerService: LinkedSellerService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private toastService: ToastService,
    private organizationService: OrganizationService,
    private profileService: IdentityProfileService,
    private profileQuery: IdentityProfileQuery,
    private skuService: SkuService,
    private saleModelService: SaleModelService,
    private portalConfigService: PortalConfigService,
    private orderService: OrderService,
    private router: Router,
    private subscriptionService: SubscribedProductService,
    private numberService: NumberService,
    private licenseSubscriptionService: LicenseSubscriptionService,
    private location: Location,
    private appsService: AppService,
    private productService: ProductService,
    private numberQuery: NumberQuery,
    private estimatedPriceService: EstimatedPriceService
  ) {
    super();
  }

  ngOnInit() {
    this.routes.params.subscribe(params => {
      this.type = params['type'];

      if (params['type'] === 'APP') {
        this.initProductData(params['id']);
      } else {
        this.initHardwareData(params['id']);
      }

      this.trial = params['trial'] === 'true';
    });

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

  getWallet() {
    this.sellerWalletService
      .getWallets(this.sellerOrgUUid)
      .pipe(map(res => res[0]))
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(wallet => {
        this.wallet = wallet;
      });
  }

  initStep() {
    this.steps = [{ id: StepName.checkout, active: false, completed: false }];

    if (this.type === 'APP') {
      if (this.product.hasAddonRequire()) {
        this.steps.unshift({ id: StepName.addons, active: false, completed: false });
      }

      if (this.purchaseSelectPlan.selectedPlan.hasNumberRequire()) {
        this.hasNumber = true;
        this.steps.unshift({ id: StepName.number, active: false, completed: false });
      }
    }

    this.steps[0].active = true;
    this.activeStep = this.steps[0].id;
  }

  initHardwareData(productId: string) {
    forkJoin([
      this.organizationService.getOrganizationByUuid(X.orgUuid),
      this.productService.getProduct(productId),
      this.profileService.getProfile()
    ])
      .pipe(
        tap(async ([org, product, profile]) => {
          this.hardwareProduct = product;

          if (this.profileQuery.currentOrg?.isUpperAdmin) {
            this.organization = org;
            this.hardwareProduct.skus.forEach(sku => (this.hardwareQuantityHash[sku.code] = 0));

            this.initStep();

            const req: GetCostStoreBySkusRequest[] = [];

            for (let i = 0; i < this.hardwareProduct.skus.length; i++) {
              const sku = this.hardwareProduct.skus[i];

              for (let j = 0; j < sku.salesModels.length; j++) {
                const saleModel = sku.salesModels[j];

                req.push({
                  productId: product.productId,
                  skuCode: sku.code,
                  saleModel: saleModel.code,
                  currency: saleModel.currency
                });
              }
            }

            const storeCosts = await firstValueFrom(this.estimatedPriceService.getCostV2(req));

            storeCosts.forEach(storeCost => {
              const sku = this.hardwareProduct.skus.find(sku => sku.code === storeCost.skuCode);

              if (!sku) {
                return;
              }

              const saleModel = sku.salesModels.find(saleModel => saleModel.code === storeCost.saleModel);

              if (!saleModel) {
                return;
              }

              saleModel.amount = +(storeCost.unitPriceTaxExcl * (1 + storeCost.taxRate)).toFixed(2);
            });

            this.hardwareDataSource = new MatTableDataSource<Sku>(this.hardwareProduct.skus);

            setTimeout(() => {
              this.hardwareDataSource.paginator = this.paginator;
            }, 0);

            this.formPM = this.fb.group({
              quantity: [0],
              billed: [
                this.hardwareProduct.skus.length
                  ? this.hardwareProduct.skus[0].salesModels[0].code
                  : this.billeds[0].key
              ]
            });

            this.loadingPM = false;
          } else {
            this.router.navigate(['purchase', 'step-fail'], {
              state: { msg: 'Your account does not have sufficient privilege to perform this action.' }
            });
          }
        })
      )
      .subscribe();
  }

  initProductData(productId: string) {
    forkJoin([
      this.organizationService.getOrganizationByUuid(X.orgUuid),
      this.appsService.getAppDetailById(productId),
      this.profileService.getProfile(),
      this.portalConfigService.getPortalConfig({ forceLoad: true })
    ])
      .pipe(
        tap(([org, product, _, portalConfig]) => {
          this.product = new AppDetailResponse(product);

          if (this.profileQuery.currentOrg?.isUpperAdmin) {
            this.organization = org;

            forkJoin([
              this.skuService.fetchSkus(org.domain, { productId, filter: '' }),
              this.saleModelService.getSaleModelDetail(org.domain, productId, org.currencyCode)
            ])
              .pipe(
                tap(([skuDetail, saleModelDetail]) => {
                  const saleModelNotBlock = this.standardSaleModel(<SaleModelResponse>saleModelDetail);

                  this.purchaseSelectPlan.appName = product.name;

                  const primarySkuDetail = this.getSkuDetailByType(skuDetail, true);
                  const addonSkuDetail = this.getSkuDetailByType(skuDetail, false);

                  this.adaptPrimarySkuDetailToPurchaseProductSkuModel(primarySkuDetail, saleModelNotBlock);
                  this.adaptAddonSkuDetailToPurchaseProductSkuModel(addonSkuDetail, saleModelDetail);
                  this.calculateEstimatedPlan();
                  this.selectPlan();
                  this.fetchAddonSku();

                  setTimeout(() => {
                    if (!portalConfig.showStore) {
                      this.router.navigate(['purchase', 'step-fail'], {
                        state: { msg: 'This feature is not supported' }
                      });
                    }

                    this.initStep();

                    this.formPM = this.fb.group({
                      subscriptionPlans: [this.purchaseSelectPlan.skuList[0]],
                      billed: [this.purchaseSelectPlan.skuList[0].selectedSaleModel.code]
                    });

                    this.formPM.controls['subscriptionPlans'].valueChanges
                      .pipe(
                        takeUntil(this.destroySubscriber$),
                        tap((value: PurchaseProductSkuModel) => {
                          this.selectedAddon = new PurchaseAddonModel();
                          this.purchaseSelectPlan.selectedPlan = value;
                          this.initStep();
                          this.fetchAddonSku();
                          this.formPM.controls['billed'].setValue(value.selectedSaleModel.code);
                        })
                      )
                      .subscribe();

                    this.formPM.controls['billed'].valueChanges
                      .pipe(
                        takeUntil(this.destroySubscriber$),
                        tap((cycleCode: string) => {
                          this.purchaseSelectPlan.selectedPlan.selectedSaleModel = this.getBillingCycle(cycleCode);

                          this.skus.forEach((item: SkuAddonModel) => {
                            const saleModelData = item.skuDetail.saleModel.find((saleModel: SaleModel) => {
                              return saleModel.code == cycleCode;
                            });
                            if (saleModelData) {
                              item.sku.saleModelCode = cycleCode;
                              item.price = this.getDomainPrice(saleModelData);
                            } else {
                              item.sku.quota = 0;
                              item.sku.saleModelCode = '';
                            }
                          });

                          this.updateSelectedAddon();
                        })
                      )
                      .subscribe();

                    if (this.product.appId === 'tzHCQsWV5usSaUVB') {
                      this.dataSource = new MatTableDataSource<PurchaseProductSkuModel>(
                        this.purchaseSelectPlan.skuList
                      );

                      setTimeout(() => {
                        this.dataSource.paginator = this.paginator;
                      }, 0);
                    }

                    this.loadingPM = false;
                  }, 0);
                })
              )
              .subscribe();
          } else {
            this.router.navigate(['purchase', 'step-fail'], {
              state: { msg: 'Your account does not have sufficient privilege to perform this action.' }
            });
          }
        })
      )
      .subscribe();
  }

  changeQuantity(sku: PurchaseProductSkuModel, quantity: number) {
    if (sku.quantity === 0 && quantity < 0) {
      return;
    }

    sku.quantity += quantity;

    //? NUMBER
    if (sku.skuCode !== NUMBER_SKU_CODE) {
      this.purchaseSelectPlan.selectedPlan = sku;
      return;
    }

    this.purchaseSelectPlan.selectedPlan = sku;

    if (quantity > 0 && sku.quantity === 1) {
      this.steps = [{ id: StepName.checkout, active: false, completed: false }];
      this.steps.unshift({ id: StepName.number, active: false, completed: false });
      this.steps[0].active = true;
      this.activeStep = this.steps[0].id;
      this.hasNumber = true;
    }

    if (quantity < 0 && sku.quantity === 0) {
      this.steps = [{ id: StepName.checkout, active: false, completed: false }];
      this.steps[0].active = true;
      this.activeStep = this.steps[0].id;
      this.hasNumber = false;
    }

    const numberSkus = Object.keys(this.numberSkuMapping);

    if (numberSkus.length) {
      this.numberSkuMapping[numberSkus[0]].total = sku.quantity;

      const selectedNumber = this.numberSkuMapping[numberSkus[0]].selectedNumbers;

      if (selectedNumber.length > sku.quantity) {
        const quota = selectedNumber.length - sku.quantity;
        selectedNumber.splice(selectedNumber.length - quota, quota);
        this.numberQuery.numbersChanged$.next(true);
      }
    }

    this.selectedNumber();
  }

  changeHardwareQuantity(code: string, quantity: number) {
    const value = this.hardwareQuantityHash[code] + quantity;

    if (value < 0) {
      return;
    }

    this.hardwareQuantityHash[code] = value;
  }

  updateSelectedAddon() {
    setTimeout(() => {
      this.selectedAddon.skus = [];
      this.skus.forEach((item: SkuAddonModel) => {
        this.selectedAddon.skus.push(item.sku);
      });
      this.selectedAddon.totalPrice = this.getTotalPrice();
    }, 0);
  }

  getTotalPrice() {
    const skuAddonPrice = this.skus
      .map((item: SkuAddonModel) => {
        return item.price * item.sku.quota;
      })
      .reduce((total, num) => {
        return total + num;
      }, 0);
    return Math.round(skuAddonPrice * 1000) / 1000;
  }

  fetchAddonSku() {
    this.skus = [];
    const skuAddonData = this.getSkuAddon();
    skuAddonData.forEach((item: SkuDetail) => {
      const temp = this.adaptToSkuSubscription(item);
      if (temp) {
        this.skus.push(temp);
      }
    });
  }

  getBillingCycle(cycleCode: string) {
    return this.purchaseSelectPlan.selectedPlan.saleModel.find((item: PurchaseProductSkuSaleModel) => {
      return item.code == cycleCode;
    });
  }

  getHardwareBillingCycle(cycleCode: string) {
    return this.hardwareProduct.skus.find(item => {
      return item.salesModels[0].code == cycleCode;
    });
  }

  getSkuAddon() {
    return this.product.skuList.filter((item: SkuDetail) => {
      return item.type == 'addon';
    });
  }

  adaptToSkuSubscription(item: SkuDetail) {
    const result = new SkuAddonModel();

    result.skuDetail = item;
    result.sku = new SkuSubscription(
      this.product.appId,
      item.uuid,
      this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code,
      0,
      false
    );

    const saleModelData = item.saleModel.find((saleModel: SaleModel) => {
      return saleModel.code == this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code;
    });

    if (saleModelData) {
      result.price = this.getDomainPrice(saleModelData);
      result.skuDetail = item;
    } else {
      if (item.saleModel.length > 0) {
        result.price = 0;
        result.sku.saleModelCode = '';
      }
    }

    return result;
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

  selectPlan() {
    this.purchaseSelectPlan.selectedPlan = this.purchaseSelectPlan.skuList[0];
  }

  changeSelectedAddon(selectedAddon: PurchaseAddonModel) {
    this.selectedAddon = selectedAddon;
  }

  calculateEstimatedPlan() {
    this.purchaseSelectPlan.skuList.forEach((item: PurchaseProductSkuModel) => {
      let estimatedPrice = item.selectedSaleModel.price;
      const addOnItem = this.product.skuList.filter((plan: SkuDetail) => {
        return plan.type == 'addon';
      });
      addOnItem.forEach((element: SkuDetail) => {
        const selectedItem = element.saleModel.find((saleModel: SaleModel) => {
          return saleModel.code == item.selectedSaleModel.code;
        });
        if (selectedItem) {
          estimatedPrice += selectedItem.domainPrice[0].amount;
        }
      });
      item.estimatedPrice = estimatedPrice;
    });
    this.purchaseSelectPlan.currency = this.organization.currencyCode;
  }

  adaptAddonSkuDetailToPurchaseProductSkuModel(skuDetail: Sku[], saleModel: SaleModelResponse) {
    // filter primary sku from store
    this.product.skuList = this.product.skuList.filter((item: SkuDetail) => {
      return (
        item.type == 'primary' ||
        skuDetail.find((temp: Sku) => {
          return temp.sku == item.uuid;
        })
      );
    });

    const tempSkuList = skuDetail.filter((item: Sku) => {
      return !this.product.skuList.find((temp: SkuDetail) => {
        return temp.uuid == item.sku;
      });
    });

    tempSkuList.forEach((temp: Sku) => {
      const result = new SkuDetail();
      result.name = temp.name;
      result.description = temp.description;
      result.type = 'addon';
      result.uuid = temp.sku;
      this.product.skuList.push(result);
    });

    this.product.skuList.forEach((item: SkuDetail) => {
      const temp = saleModel.content.find((skuModel: SkuModel) => {
        return skuModel.skuCode == item.uuid;
      });
      if (temp) {
        item.saleModel = temp.saleModel;
        const tempSku = skuDetail.find((temp: Sku) => {
          return temp.sku == item.uuid;
        });
        if (tempSku) {
          item.description = tempSku.description;
        }
        item.saleModel.forEach((saleModel: SaleModel) => {
          this.skuService
            .getSaleModel(this.product.appId, item.uuid, saleModel.code)
            .subscribe((response: PriceChain) => {
              const temp = new PriceChain(response);
              const priceModel = saleModel.domainPrice.find((price: PriceModel) => price.currency == response.currency);
              if (priceModel) {
                priceModel.amount = temp.getRealPrice();
              }
            });
        });
      }
    });
  }

  adaptPrimarySkuDetailToPurchaseProductSkuModel(skuDetail: Sku[], saleModel: SaleModelResponse) {
    // filter primary sku from store
    this.product.skuList = this.product.skuList.filter((item: SkuDetail) => {
      return (
        item.type != 'primary' ||
        skuDetail.find((temp: Sku) => {
          return temp.sku == item.uuid;
        })
      );
    });

    const tempSkuList = skuDetail.filter((item: Sku) => {
      return !this.product.skuList.find((temp: SkuDetail) => {
        return temp.uuid == item.sku;
      });
    });

    tempSkuList.forEach((temp: Sku) => {
      const result = new SkuDetail();
      result.name = temp.name;
      result.description = temp.description;
      result.maxNumber = 0;
      result.type = 'primary';
      result.uuid = temp.sku;
      this.product.skuList.push(result);
    });

    skuDetail.forEach((sku: Sku) => {
      const saleModelData = saleModel.content.find((item: SkuModel) => {
        return item.skuCode == sku.sku;
      });
      const temp = new PurchaseProductSkuModel();
      temp.skuCode = saleModelData.skuCode;
      temp.saleModel = saleModelData.saleModel.map((data: SaleModel) => {
        const temp = new PurchaseProductSkuSaleModel();
        temp.code = data.code;
        const domainPrice = data.domainPrice.find((temp1: PriceModel) => {
          return temp1.currency == this.organization.currencyCode;
        });
        temp.price = domainPrice ? domainPrice.amount : 0;
        return temp;
      });
      temp.saleModel = temp.saleModel.sort((a: PurchaseProductSkuSaleModel, b: PurchaseProductSkuSaleModel) => {
        if (a.price < b.price) return -1;
        if (a.price > b.price) return 1;
        return 0;
      });
      temp.selectedSaleModel = temp.saleModel[0];
      temp.skuName = sku.name;
      temp.skuDescription = sku.description;
      if (temp.saleModel.length > 0) {
        const selectedItem = this.product.skuList.find((item: SkuDetail) => {
          return item.uuid == temp.skuCode;
        });
        temp.maxNumber = selectedItem.maxNumber || 0;

        this.purchaseSelectPlan.skuList.push(temp);
      }
    });
    this.purchaseSelectPlan.skuList.forEach((item: PurchaseProductSkuModel) => {
      item.saleModel.forEach((saleModel: PurchaseProductSkuSaleModel) => {
        this.skuService
          .getSaleModel(this.product.appId, item.skuCode, saleModel.code)
          .subscribe((response: PriceChain) => {
            const temp = new PriceChain(response);
            saleModel.price = temp.getRealPrice();
          });
      });
    });
  }

  standardSaleModel(saleModel: SaleModelResponse) {
    saleModel.content.forEach((item: SkuModel) => {
      item.saleModel = item.saleModel.filter((temp: SaleModel) => {
        return !temp.domainPrice[0].isBlocked;
      });
    });
    return saleModel;
  }

  getSkuDetailByType(skuDetail: Sku[], isPrimary: boolean) {
    const result = skuDetail.filter((item: Sku) => {
      if (isPrimary) {
        return item.isPrimary;
      } else {
        return !item.isPrimary;
      }
    });
    return result.sort((a: Sku, b: Sku) => {
      if (a.order < b.order) {
        return -1;
      }
      if (a.order > b.order) {
        return 1;
      }
      return 0;
    });
  }

  openTopup() {
    const config: Topup2Input = {
      showAutoTopup: true,
      wallet: this.wallet,
      onlineOnly: true
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
    }
  }

  get totalPrice() {
    let total = 0;

    if (this.type === 'APP') {
      if (this.purchaseSelectPlan.selectedPlan.hasNumberRequire() && Object.keys(this.numberSkuMapping).length) {
        const numberSku = this.numberSkuMapping[Object.keys(this.numberSkuMapping)[0]];
        total += numberSku.price * numberSku.selectedNumbers.length + this.totalActivationFee;
      }

      if (this.product.hasAddonRequire()) {
        total += this.selectedAddon.totalPrice;
      }

      if (this.product.appId === 'tzHCQsWV5usSaUVB') {
        const skus = this.purchaseSelectPlan.skuList.filter(s => s.quantity > 0);

        skus.forEach(s => {
          total +=
            s.quantity * s.selectedSaleModel.price + (s.skuCode === NUMBER_SKU_CODE ? this.totalActivationFee : 0);
        });
      } else {
        total += this.purchaseSelectPlan.selectedPlan.selectedSaleModel.price;
      }
    } else {
      if (this.hardwareProduct?.skus?.length) {
        this.hardwareProduct.skus.forEach(sku => {
          total += this.hardwareQuantityHash[sku.code] * sku.salesModels[0].amount;
        });
      }
    }

    return total;
  }

  getAddress() {
    if (this.organization.billingInfo) {
      const arr = [];
      arr.push(this.organization.name);
      arr.push(this.organization.billingInfo.addressLineOne);
      arr.push(this.organization.billingInfo.addressLineTwo);
      const temp = [];
      temp.push(this.organization.billingInfo.city);
      temp.push(this.organization.billingInfo.state);
      temp.push(this.organization.billingInfo.zip);
      arr.push(temp.join(', '));
      return arr.join('\n');
    } else {
      return '';
    }
  }

  get disabledPayment() {
    if (this.product?.appId === 'tzHCQsWV5usSaUVB') {
      const skus = this.purchaseSelectPlan?.skuList?.filter(s => s.quantity > 0);
      return skus?.length <= 0;
    }

    if (this.type !== 'APP') {
      const skus = this.hardwareProduct?.skus?.filter(s => this.hardwareQuantityHash[s.code] > 0);
      return skus?.length <= 0;
    }

    return false;
  }

  payment() {
    if (this.type !== 'APP') {
      if (this.hardwareProduct.skus[0].salesModels[0].code !== 'one_off') {
        const skus = this.hardwareProduct.skus.filter(s => this.hardwareQuantityHash[s.code] > 0);
        const obs: Observable<SubscriptionLicense>[] = [];

        skus.forEach(sku => {
          const items = [
            {
              autoRenew: this.autoRenew,
              multiplier: 1,
              productId: this.hardwareProduct.productId,
              quantity: this.hardwareQuantityHash[sku.code],
              saleModelCode: this.formPM.controls['billed'].value,
              sku: sku.code,
              trial: this.trial
            }
          ];

          const body: SubscriptionLicense = {
            items: items as BundleItem[]
          };

          obs.push(this.licenseSubscriptionService.buySubscribe(body));
        });

        forkJoin(obs).subscribe(
          _ => this.router.navigate(['purchase', 'success']),
          _ => this.router.navigate(['purchase', 'fail'])
        );
      } else {
        const orderRequest = new OrderRequest();
        orderRequest.shippingAddress = this.getAddress();
        orderRequest.orderItems = [];
        orderRequest.orderItems.push(
          new OrderItem(
            this.hardwareProduct.productId,
            this.hardwareProduct.skus[0].code,
            this.hardwareProduct.skus[0].salesModels[0].code,
            this.hardwareQuantityHash[this.hardwareProduct.skus[0].code]
          )
        );

        this.orderService.purchaseOrder(orderRequest).subscribe(
          () => {
            this.router.navigate(['purchase', 'success']);
          },
          error => {
            this.router.navigate(['purchase', 'fail']);

            if ('billing.insufficientBalance' == error.code) {
              X.showWarn(error.message);
            } else {
              X.showWarn(
                'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
              );
            }
          }
        );
      }
    } else if (this.product.appId === 'tzHCQsWV5usSaUVB') {
      const skus = this.purchaseSelectPlan.skuList.filter(s => s.quantity > 0);
      const obs: Observable<SubscriptionLicense>[] = [];

      skus.forEach(sku => {
        const items: any = [
          {
            autoRenew: this.autoRenew,
            multiplier: sku.quantity,
            productId: this.product.appId,
            quantity: 1,
            saleModelCode: sku.selectedSaleModel.code,
            sku: sku.skuCode,
            trial: this.trial
          }
        ];

        //? NUMBER
        if (sku.skuCode === NUMBER_SKU_CODE) {
          const numbers = this.numberSkuMapping[Object.keys(this.numberSkuMapping)[0]]?.selectedNumbers.map(
            s => s.number
          );

          items[0].numberProduct = this.numberVendor.selected.productId;
          items[0].numberSku = this.numberVendor.selected.selectedSku.sku;
          items[0].numbers = numbers;
          items[0].quantity = numbers.length;
        }

        const body: SubscriptionLicense = {
          items: items as BundleItem[]
        };

        obs.push(this.licenseSubscriptionService.buySubscribe(body));
      });

      forkJoin(obs).subscribe(
        _ => this.router.navigate(['purchase', 'success']),
        _ => this.router.navigate(['purchase', 'fail'])
      );
    } else if (this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code == 'one_off') {
      const orderRequest = new OrderRequest();
      orderRequest.shippingAddress = this.getAddress();
      orderRequest.orderItems = [];
      orderRequest.orderItems.push(
        new OrderItem(
          this.product.appId,
          this.purchaseSelectPlan.selectedPlan.skuCode,
          this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code,
          1
        )
      );
      this.orderService.purchaseOrder(orderRequest).subscribe(
        () => {
          this.router.navigate(['purchase', 'success']);
        },
        error => {
          this.router.navigate(['purchase', 'fail']);

          if ('billing.insufficientBalance' == error.code) {
            X.showWarn(error.message);
          } else {
            X.showWarn(
              'Sorry, an error has occurred when we try to fulfill your request. Please try again in a few minutes.'
            );
          }
        }
      );
    } else {
      const purchaseSubscriptionRequest = new PurchaseSubscriptionRequest();
      purchaseSubscriptionRequest.autoRenew = this.autoRenew;
      purchaseSubscriptionRequest.multiplier = 1;
      purchaseSubscriptionRequest.trial = this.trial;

      // push primary sku
      const temp = new SkuSubscription(
        this.product.appId,
        this.purchaseSelectPlan.selectedPlan.skuCode,
        this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code,
        1,
        true
      );
      purchaseSubscriptionRequest.skus.push(temp);

      // push number sku
      if (this.numberSkuMapping[Object.keys(this.numberSkuMapping)[0]]?.selectedNumbers?.length) {
        const temp = new SkuSubscription(
          this.numberVendor.selected.productId,
          Object.keys(this.numberSkuMapping)[0],
          this.purchaseSelectPlan.selectedPlan.selectedSaleModel.code,
          this.numberSkuMapping[Object.keys(this.numberSkuMapping)[0]]?.selectedNumbers?.length,
          false
        );
        purchaseSubscriptionRequest.skus.push(temp);
      }

      // push non primary sku
      if (this.selectedAddon) {
        this.selectedAddon.skus.forEach((item: SkuSubscription) => {
          purchaseSubscriptionRequest.skus.push(item);
        });
      }

      this.subscriptionService.buySubscribe(purchaseSubscriptionRequest).subscribe(
        response => {
          const selectedNumbers = this.numberSkuMapping[Object.keys(this.numberSkuMapping)[0]]?.selectedNumbers;
          if (selectedNumbers?.length) {
            const assignObservable = [];
            selectedNumbers.forEach(item => {
              const assignNumberRequest = new AssignNumberRequest(
                new AssignNumberData(this.product.appId, response.subscriptionUuid),
                ''
              );
              assignObservable.push(this.numberService.assignNumberV3(item.number, response.subscriptionUuid));
            });
            forkJoin(assignObservable).subscribe(
              data => {
                this.router.navigate(['purchase', 'success']);
              },
              error => {
                X.showWarn(
                  'Sorry, an error has occurred when we try to assign number to this subscription. Please assign number later.'
                );
                this.router.navigate(['purchase', 'fail']);
              }
            );
          } else {
            this.router.navigate(['purchase', 'success']);
          }
        },
        error => {
          this.router.navigate(['purchase', 'fail']);
          X.showWarn('Sorry, an error has occurred when we try to fulfill your request. Please try again.');
        }
      );
    }
  }

  cancel() {
    this.router.navigate(['']);
  }

  next() {
    if (this.activeStep === StepName.number) {
      this.numberService
        .checkMultiDocument(Object.keys(this.numberSkuMapping), X.orgUuid)
        .pipe(
          tap(check => {
            if (check[0].valid) {
              this.finishSelectNumber();
              this.nextStep();
              return;
            }

            const msg = `Document of ${check[0].sku} numbers is invalid`;
            this.toastService.warning(msg);
            throw new Error(msg);
          })
        )
        .subscribe();
    } else {
      this.nextStep();
    }
  }

  nextStep() {
    const currentActiveStep = this.steps.findIndex(s => s.active);
    if (currentActiveStep === this.steps.length - 1) {
      // last step
    } else {
      this.steps[currentActiveStep].active = false;
      this.steps[currentActiveStep].completed = true;
      this.steps[currentActiveStep + 1].active = true;
      this.activeStep = this.steps[currentActiveStep + 1].id;
    }
  }

  finishSelectNumber() {
    const selectedNumbers = this.numberSkuMapping[Object.keys(this.numberSkuMapping)[0]].selectedNumbers;
    const numbers = selectedNumbers.map(s => s.number);

    if (selectedNumbers?.length >= this.getMinNumber()) {
      this.numberService.calcActivationFee(numbers).subscribe(fee => (this.totalActivationFee = fee));

      const seletectAvailableNumber = selectedNumbers.filter(item => {
        return item.state == 'Available';
      });

      if (seletectAvailableNumber && seletectAvailableNumber.length > 0) {
        const reserveNumberObservable = [];

        seletectAvailableNumber.forEach(item => {
          const reserveNumberRequest = new ReserveNumberRequest(
            new ReserveNumberData(new ReserveNumberDuration(30, 'MINUTES')),
            ''
          );
          reserveNumberObservable.push(this.numberService.reserveNumberV3(item.number, X.orgUuid));
        });

        forkJoin(reserveNumberObservable).subscribe(
          data => {
            const cloneSelectedNumbers = cloneDeep(selectedNumbers);
            cloneSelectedNumbers.forEach(item => {
              item.state = 'Reserved';
            });
            this.numberSkuMapping[Object.keys(this.numberSkuMapping)[0]].selectedNumbers = cloneSelectedNumbers;
          },
          error => {
            console.log(error);
            this.router.navigate(['purchase', 'step-fail'], {
              state: { msg: 'Sorry, an error has occurred when we try to fulfill your request. Please try again.' }
            });
          }
        );
      } else {
      }
    } else {
      const msg = `You must select at least ${this.getMinNumber()} number(s)`;
      this.toastService.warning(msg);
      throw new Error(msg);
    }
  }

  getMinNumber() {
    const sku = this.product.skuList.find((item: SkuDetail) => {
      return item.uuid == this.purchaseSelectPlan.selectedPlan.skuCode;
    });

    if (sku) {
      return sku.minNumber > 0 ? sku.minNumber : 1;
    }

    return 1;
  }

  selectedNumber() {
    this.reservedAllNumber = !Object.keys(this.numberSkuMapping)
      .map(
        numberSku => this.numberSkuMapping[numberSku].selectedNumbers.length === this.numberSkuMapping[numberSku].total
      )
      .includes(false);
  }

  changeNumberSkuMapping(numberSkuMapping: HashMap<SkuInfo>) {
    this.numberSkuMapping = numberSkuMapping;
  }

  changeNumberVendor(numberVendor: NumberVendorModel) {
    this.numberVendor = numberVendor;
  }
}
