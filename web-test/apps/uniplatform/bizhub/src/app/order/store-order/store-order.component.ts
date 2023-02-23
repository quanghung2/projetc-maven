import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  AdminOpsService,
  Organization,
  OrganizationService,
  PromoteEntityType,
  PromoteReq,
  QueryOrgReq,
  RealDomainService
} from '@b3networks/api/auth';
import { Contract, ContractItem, ContractService } from '@b3networks/api/contract';
import { FileService, S3Service } from '@b3networks/api/file';
import {
  Bundle,
  BundleItem,
  BundleQuery,
  BundleService,
  BundleStatus,
  CreateOrderReq,
  FileInfo,
  GetBundleReq,
  Order,
  OrderBundle,
  OrderBundleItem,
  OrderService,
  SingtelAction
} from '@b3networks/api/license';
import { B3Number, NumberService } from '@b3networks/api/number';
import { GetPriceChangeReq, PriceChain, PricingService, Product, ProductService } from '@b3networks/api/store';
import { arrayCompare, DestroySubscriberComponent, donwloadFromUrl } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap, ID } from '@datorama/akita';
import { addDays } from 'date-fns';
import { combineLatest, firstValueFrom, forkJoin, Observable, of, Subject, timer } from 'rxjs';
import {
  catchError,
  debounceTime,
  filter,
  finalize,
  mergeMap,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';
import { ApproveOrderComponent, ApproveOrderInput } from '../approve-order/approve-order.component';
import { SelectNumberComponent, SelectNumberInput, SkuInfo } from '../select-number/select-number.component';

export declare type StoreOrderActionType = 'create' | 'update' | 'approve' | 'view';

export interface StoreOrderInput {
  order?: Order;
  type: StoreOrderActionType;
}

const InitData = {
  singtelInfo: {
    actions: [
      { key: SingtelAction.provision_v2, value: 'Provision V2' },
      { key: SingtelAction.multiline_voice_provision, value: 'Multiline voice provision' } // simType always virtual for this action
    ],
    services: [
      { key: 'api', value: 'API' },
      { key: 'bizphone', value: 'Bizphone' },
      { key: 'flow', value: 'Flow' },
      { key: 'msteam', value: 'MS Team' },
      { key: 'voicecallrecording', value: 'Voice Call Recording' },
      // { key: 'multiline', value: 'Multiline' }, // Singtel does not support
      { key: 'virtualline', value: 'Virtual Line' },
      { key: 'wallboard', value: 'Call Center' }
    ],
    simTypes: [
      { key: 'physical', value: 'Physical' },
      { key: 'virtual', value: 'Virtual' }
    ]
  }
};

const NUMBER_SKU_CODE = '78f90911-e6ef-4c79-afaa-f554fd20f9c5';

function buildPricingMappingKey(orgUuid, productId, sku: string) {
  return `${orgUuid}_${productId}_${sku}`;
}

class Item {
  productId: string;
  sku: string;
  saleModelCode: 'monthly' | 'yearly';
  quantity: number;
  numberSku: string;
  type: 'BASE' | 'ADDON';
  newQuantity: number;
  isNew: boolean;
  isRemoved: boolean;
  numberProduct?: string;

  get isChanged() {
    return this.newQuantity != null && this.newQuantity !== this.quantity;
  }

  get rightQuantity() {
    return this.isChanged ? this.newQuantity : this.quantity;
  }

  constructor(item: Partial<OrderBundleItem | BundleItem | Item>) {
    if (item) {
      Object.assign(this, item);
    }
  }
}
@Component({
  selector: 'b3n-store-order',
  templateUrl: './store-order.component.html',
  styleUrls: ['./store-order.component.scss'],
  providers: [CurrencyPipe, DatePipe]
})
export class StoreOrderComponent extends DestroySubscriberComponent implements OnInit {
  private _order: Order;

  private _msisdnFormSub$ = new Subject<boolean>();
  private _pricingMapping: HashMap<PriceChain> = {}; // key is concatOf(orgUuid, productId, sku)

  actionType: StoreOrderActionType;
  ctaTitle: string;
  ctaButton: 'Create' | 'Update' | 'Approve';

  readonly InitData = InitData;

  orderFG: UntypedFormGroup;

  searchOrgFC: UntypedFormControl = new UntypedFormControl();
  organizations$: Observable<Organization[]>;

  searchBundleFC: UntypedFormControl = new UntypedFormControl();
  bundles$: Observable<Bundle[]>;

  totalNumberCount = 0;
  hasMSISDNNumber: boolean;
  selectedNumbers: B3Number[] = [];

  summaryHtml: string;
  bundleChanged: boolean;

  progressing: boolean;
  rejecting: boolean;
  orderFormFiles: File[] = [];
  fileInfos: FileInfo[];

  minDate: Date = new Date();
  maxDate: Date = addDays(new Date(), 30);
  checkDocumentRes: boolean;
  contracts: Contract[] = [];
  hiddenContracts: number[] = [];
  contractErrorMsg: string;
  fetchedNumber: boolean;
  numberProducts: Product[] = [];

  get bundlesFA(): UntypedFormArray {
    return this.orderFG.get('bundles') as UntypedFormArray;
  }

  get numbersFA() {
    return this.orderFG.get('numbers') as UntypedFormArray;
  }

  get timeRange() {
    return this.orderFG.get('timeRange');
  }

  private get _numberItems() {
    const result: BundleItem[] = [];
    this.bundlesFA.value.forEach(b => {
      result.push(
        ...this.bundleQuery.getNumberItems([b.id]).map(i => {
          const a = <BundleItem>{ ...i };
          a.quantity = a.quantity * b.quantity;
          return a;
        })
      );
    });

    return result;
  }

  @ViewChild('searchOrgInput') searchOrgInput: ElementRef<HTMLInputElement>;
  @ViewChild('searchBundleInput') searchBundleInput: ElementRef<HTMLInputElement>;

  constructor(
    @Inject(MAT_DIALOG_DATA) data: StoreOrderInput,
    private fb: UntypedFormBuilder,
    private realDomainService: RealDomainService,
    private orgService: OrganizationService,
    private adminOpsService: AdminOpsService,
    private pricingService: PricingService,
    private bundleQuery: BundleQuery,
    private bundleService: BundleService,
    private orderService: OrderService,
    private toastr: ToastService,
    private dialogRef: MatDialogRef<StoreOrderComponent>,
    private dialog: MatDialog,
    private currencyPipe: CurrencyPipe,
    private datePipe: DatePipe,
    private s3Service: S3Service,
    private fileService: FileService,
    private numberService: NumberService,
    private contractService: ContractService,
    private productService: ProductService
  ) {
    super();
    this._order = data.order;
    this.actionType = data.type;
    this.minDate.setHours(0, 0, 0);

    switch (this.actionType) {
      case 'create':
        this.ctaButton = 'Create';
        this.ctaTitle = 'Create order';
        break;
      case 'update':
        this.ctaButton = 'Update';
        this.ctaTitle = 'Update order';
        break;

      case 'approve':
        this.ctaButton = 'Approve';
        this.ctaTitle = 'Review order';
        break;
      case 'view':
        this.ctaTitle = 'View order details';

        break;
      default:
        break;
    }

    this.fileInfos = this._order?.fileInfos
      ? this._order.fileInfos.map(file => {
          const fileSplitted = file.s3Key.split('/').pop().split('.').shift().split('_');
          fileSplitted.shift();
          fileSplitted.pop();

          const fileName = fileSplitted.join('_') + '.csv';

          return {
            ...file,
            name: fileName
          } as FileInfo;
        })
      : [];

    if (this._order?.numbers?.length) {
      this.checkDocument();
    }

    this.initForm();
  }

  ngOnInit(): void {
    this.realDomainService
      .getRealDomainFromPortalDomain()
      .pipe(
        mergeMap(result => {
          return this.adminOpsService.promote(<PromoteReq>{
            entityType: PromoteEntityType.domain,
            entityUuid: result.domain
          });
        })
      )
      .subscribe();
    this.bundleService
      .get(<GetBundleReq>{ statuses: [BundleStatus.active, BundleStatus.deleted] })
      .subscribe(async _ => {
        if (this.actionType !== 'create') {
          await this.initUpdatingBunleData();
        } else {
          this.searchOrgFC.setValue(''); // set org to start search for create
        }
      });
  }

  selectNumber() {
    this.dialog
      .open(SelectNumberComponent, {
        width: '900px',
        disableClose: true,
        data: <SelectNumberInput>{
          numberSkus: this._numberItems,
          selectedNumbers: this.selectedNumbers,
          orgUuid: this.orderFG.get('org').value.uuid
        }
      })
      .afterClosed()
      .subscribe((skuInfoMapping: HashMap<SkuInfo> | null) => {
        if (skuInfoMapping != null) {
          this.numbersFA.clear();
          this.selectedNumbers = [];
          Object.keys(skuInfoMapping).forEach(numberSku => {
            this.selectedNumbers.push(...skuInfoMapping[numberSku].selectedNumbers);
            skuInfoMapping[numberSku].selectedNumbers.forEach(n => {
              this.numbersFA.push(
                this.fb.control({
                  licenseSku: skuInfoMapping[numberSku].sku,
                  numberSku: numberSku,
                  number: n.number
                })
              );
            });
          });
        }
      });
  }

  removeBundle(idx: number) {
    this.contractErrorMsg = '';
    this.bundlesFA.removeAt(idx);
    this.searchBundleFC.setValue(''); //trigger bundle changed
  }

  async process() {
    switch (this.actionType) {
      case 'approve':
        const result = await this.dialog
          .open(ApproveOrderComponent, {
            width: '500px',
            data: <ApproveOrderInput>{
              order: this._order,
              type: 'approve'
            }
          })
          .afterClosed()
          .toPromise();
        if (!result) {
          return;
        }

        this.progressing = true;

        // check old number list vs the new one
        // update order when numbers are changed
        const newSelectedNumbers: string[] = this.selectedNumbers.map(n => n.number);
        const oldSelectedNumbers: string[] = this._order.numbers?.map(n => n.number) || [];
        if (!arrayCompare(newSelectedNumbers, oldSelectedNumbers)) {
          try {
            const updateOrderReq = this.orderFG.getRawValue() as CreateOrderReq;

            if (updateOrderReq['contract']) {
              updateOrderReq.contractNumber = (updateOrderReq['contract'] as Contract).contractNumber;
              delete updateOrderReq['contract'];
            }

            if (updateOrderReq.billingStartDate) {
              updateOrderReq.billingStartDate = new Date(updateOrderReq.billingStartDate)
                .toISOString()
                .split('T')
                .shift();
            }

            updateOrderReq.orgUuid = updateOrderReq['org'].uuid;
            delete updateOrderReq['org'];
            updateOrderReq.bundles = updateOrderReq.bundles.map(b => <OrderBundle>{ id: b.id, quantity: b.quantity });
            if (this.totalNumberCount === 0) {
              updateOrderReq.numbers = [];
            }

            updateOrderReq.fileInfos = this._order.fileInfos;

            await this.orderService.update(this._order.id, updateOrderReq).toPromise();

            const resp = await this.orderService.approve(this._order.id, result.remark).toPromise();
            this.toastr.success('Approved order successfully');
            this.dialogRef.close(resp);
          } catch (error) {
            this.toastr.warning(error['message']);
          } finally {
            this.progressing = false;
          }
        } else {
          try {
            const resp = await this.orderService.approve(this._order.id, result.remark).toPromise();
            this.toastr.success('Approved order successfully');
            this.dialogRef.close(resp);
          } catch (error) {
            this.toastr.warning(error['message']);
          } finally {
            this.progressing = false;
          }
        }

        break;
      case 'update':
        this._update();
        break;
      case 'create':
        this._create();
        break;
    }
  }

  reject() {
    this.dialog
      .open(ApproveOrderComponent, {
        width: '500px',
        data: <ApproveOrderInput>{
          order: this._order,
          type: 'reject'
        }
      })
      .afterClosed()
      .subscribe((result: { remark: string }) => {
        if (result) {
          this.rejecting = true;
          this.orderService
            .reject(this._order.id, result.remark)
            .pipe(finalize(() => (this.rejecting = false)))
            .subscribe(
              _ => {
                this.toastr.success(`Rejected order successfully`);
                this.dialogRef.close();
              },
              error => {
                this.toastr.warning(error['message']);
              }
            );
        }
      });
  }

  orgDisplayFn(item: Organization) {
    return item ? `${item.name} (${item.uuid})` : null;
  }

  bundleDisplayFn(item: Bundle) {
    return item ? item.name : null;
  }

  contractDisplayFn(item: Contract) {
    return item ? item.contractNumber : null;
  }

  private async _create() {
    this.progressing = true;
    const req = this.orderFG.getRawValue() as CreateOrderReq;

    if (req.billingStartDate) {
      req.billingStartDate = new Date(req.billingStartDate).toISOString().split('T').shift();
    }

    req.orgUuid = req['org'].uuid;
    delete req['org'];

    req.bundles = req.bundles.map(b => <OrderBundle>{ id: b.id, quantity: b.quantity });
    if (this.totalNumberCount === 0) {
      req.numbers = [];
    }

    try {
      const fileInfos: FileInfo[] = [];

      for (let i = 0; i < this.orderFormFiles.length; i++) {
        const fileUploadResp = await this.s3Service
          .generalUpload(this.orderFormFiles[i], 'businessHub', `orders/order_${this._order.id}`)
          .toPromise();
        const fileTime = fileUploadResp.fileKey.split('_').pop().split('.')[0];
        const fileInfo: FileInfo = {
          s3Key: fileUploadResp.fileKey,
          uploadedAt: new Date(+fileTime).toISOString()
        };

        fileInfos.push(fileInfo);
      }

      if (fileInfos.length) {
        req.fileInfos = fileInfos;
      }

      if (req['contract']) {
        req.contractNumber = (req['contract'] as Contract).contractNumber;
        delete req['contract'];
      }

      const resp = await this.orderService.create(req).toPromise();
      this.toastr.success(`Created order successfully`);
      this.dialogRef.close(resp);
    } catch (error) {
      this.toastr.warning(error['message']);
    } finally {
      this.progressing = false;
    }
  }

  private async _update() {
    this.progressing = true;
    const req = this.orderFG.getRawValue() as CreateOrderReq;

    if (req.billingStartDate) {
      req.billingStartDate = new Date(req.billingStartDate).toISOString().split('T').shift();
    }

    req.orgUuid = req['org'].uuid;
    delete req['org'];

    req.bundles = req.bundles.map(b => <OrderBundle>{ id: b.id, quantity: b.quantity });
    if (this.totalNumberCount === 0) {
      req.numbers = [];
    }

    if (req['contract']) {
      req.contractNumber = (req['contract'] as Contract).contractNumber;
      delete req['contract'];
    }

    try {
      const fileInfos: FileInfo[] = [];

      for (let i = 0; i < this.orderFormFiles.length; i++) {
        const fileUploadResp = await this.s3Service
          .generalUpload(this.orderFormFiles[i], 'businessHub', `orders/order_${this._order.id}`)
          .toPromise();
        const fileTime = fileUploadResp.fileKey.split('_').pop().split('.')[0];
        const fileInfo: FileInfo = {
          s3Key: fileUploadResp.fileKey,
          uploadedAt: new Date(+fileTime).toISOString()
        };

        fileInfos.push(fileInfo);
      }

      const defaultFileInfos = this._order?.fileInfos ?? [];
      req.fileInfos = fileInfos.length ? [...defaultFileInfos, ...fileInfos] : defaultFileInfos;

      const resp = await this.orderService.update(this._order.id, req).toPromise();
      this.toastr.success(`Updated order successfully`);
      this.dialogRef.close(resp);
    } catch (error) {
      this.toastr.warning(error['message']);
    } finally {
      this.progressing = false;
    }
  }

  private async initForm() {
    if (this.actionType !== 'create') {
      this.searchOrgFC.disable();
      if (['approve', 'view'].includes(this.actionType)) {
        this.searchBundleFC.disable();
      }
    }

    this.orderFG = this.fb.group({
      org: [null, [Validators.required]],
      excludeBase: [this._order?.excludeBase || false, [Validators.required]],
      bundles: this.fb.array([], [Validators.required, Validators.min(1)]),
      numbers: this.fb.array([]),
      billingStartDate: [this._order?.billingStartDate ? new Date(this._order?.billingStartDate) : ''],
      contract: [null]
    });

    this.orderFG.controls['org'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(org => !!org),
        tap(async (org: Organization) => {
          this.contracts = await firstValueFrom(this.contractService.getContracts(org.uuid));

          if (this._order?.contractNumber) {
            const contract = this.contracts.find(c => c.contractNumber === this._order.contractNumber);
            this.orderFG.controls['contract'].setValue(contract);
          }
        })
      )
      .subscribe();

    this.organizations$ = this.searchOrgFC.valueChanges.pipe(
      debounceTime(200),
      switchMap(value => {
        if (!value) {
          this.orderFG.get('org').setValue(null);
        }
        if (value instanceof Organization) {
          this.orderFG.get('org').setValue(value);
          if (this.bundlesFA.controls.length) {
            this.bundlesFA.controls.forEach((b, i) => {
              this.getBundlePrice(this.bundleQuery.getOne(b.value.id), () => this.removeBundle(i));
            });
          }
          return of([]);
        } else {
          return this.orgService.queryOrgs(
            <QueryOrgReq>{
              keyword: value,
              licenseEnabled: true
            },
            { page: 0, perPage: 10 }
          );
        }
      })
    );

    this.bundles$ = this.searchBundleFC.valueChanges.pipe(
      startWith(''),
      switchMap(value => {
        if (typeof value === 'string' || value instanceof String || !value) {
          const selectedIDs: ID[] = this.bundlesFA.value.map(b => b.id);
          return this.bundleQuery.selectAll({
            filterBy: e =>
              e.status === BundleStatus.active &&
              !selectedIDs.includes(e.id) &&
              e.name?.toLocaleLowerCase().includes(String(value?.toLocaleLowerCase()))
          });
        } else {
          const bundle = value as Bundle;

          if (bundle != null) {
            const bundleForm = this.fb.group({
              id: bundle.id,
              name: bundle.name,
              quantity: [1, [Validators.required, Validators.min(1)]],
              deleted: bundle.status === BundleStatus.deleted
            });

            this.bundlesFA.push(bundleForm);

            this.getBundlePrice(bundle, () => this.removeBundle(this.bundlesFA.length - 1));
            setTimeout(() => {
              this.searchBundleFC.setValue('');
              this.searchBundleInput.nativeElement.blur();
            });
          }

          return of([]);
        }
      })
    );

    this.bundlesFA.valueChanges.pipe(debounceTime(200)).subscribe((bundles: HashMap<any>[]) => {
      this.totalNumberCount = this._numberItems.map(n => n.quantity).reduce((a, b) => a + b, 0);
      if (this.totalNumberCount > 0 && this._numberItems.findIndex(n => n.numberSku === 'SG.MSISDN') > -1) {
        if (!this.orderFG.contains('singtelInfo')) {
          const singtelInfo = this._order?.singtelInfo;
          this.orderFG.addControl(
            'singtelInfo',
            this.fb.group({
              brn: [singtelInfo?.brn, Validators.required],
              action: singtelInfo?.action || InitData.singtelInfo.actions[0].key,
              service: singtelInfo?.service || InitData.singtelInfo.services[0].key,
              simType: singtelInfo?.simType || InitData.singtelInfo.simTypes[0].key
            })
          );
        }

        this.hasMSISDNNumber = true;
        this.orderFG
          .get('singtelInfo')
          .get('action')
          .valueChanges.pipe(
            debounceTime(200),
            takeUntil(combineLatest([this._msisdnFormSub$, this.destroySubscriber$]))
          )
          .subscribe(action => {
            if (action === SingtelAction.multiline_voice_provision) {
              this.orderFG.get('singtelInfo').get('simType').setValue('virtual');
              this.orderFG.get('singtelInfo').get('simType').disable();
            } else {
              this.orderFG.get('singtelInfo').get('simType').enable();
            }
          });
        if (this.actionType === 'approve') {
          this.orderFG.get('singtelInfo').disable();
        }
      } else {
        this.hasMSISDNNumber = false;
        this._msisdnFormSub$.next(false);
        this.orderFG.removeControl('singtelInfo');
      }
    });

    this.orderFG.controls['contract'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(async (contract: Contract) => {
          this.contractErrorMsg = '';

          if (!contract) {
            return;
          }

          if (!this.fetchedNumber) {
            this.fetchedNumber = true;
            this.numberProducts = await firstValueFrom(this.productService.geAvailableProducts({ type: 'NUMBER' }));
          }
        })
      )
      .subscribe();

    this.buildSummary(this.orderFG.value);

    this.orderFG.valueChanges.pipe(debounceTime(200)).subscribe(order => {
      this.hiddenContracts = [];

      if (this.contracts.length && order['bundles']?.length) {
        (order['bundles'] as Bundle[]).forEach(b => {
          const bundle = this.bundleQuery.getOne(b.id);

          for (let j = 0; j < this.contracts.length; j++) {
            if (bundle.items.length > this.contracts[j].items.length && !this.hiddenContracts.includes(j)) {
              this.hiddenContracts.push(j);
              continue;
            } else {
              for (let i = 0; i < bundle.items.length; i++) {
                let cItem: ContractItem = this.contracts[j].items.find(cItem => {
                  return cItem.sku === (bundle.items[i].numberSku ?? bundle.items[i].sku);
                });
                if (cItem) {
                  if (
                    cItem.productId === bundle.items[i].numberProduct &&
                    cItem.sku !== bundle.items[i].numberSku &&
                    !this.hiddenContracts.includes(j)
                  ) {
                    this.hiddenContracts.push(j);
                    break;
                  }
                } else {
                  if (!this.hiddenContracts.includes(j)) {
                    this.hiddenContracts.push(j);
                  }

                  break;
                }
              }
            }
          }
        });
      }

      const contract: Contract = this.orderFG.controls['contract'].value;
      const contractIdx = this.contracts.findIndex(c => c.contractNumber === contract?.contractNumber);

      if (
        contract &&
        ((this.contracts.length && this.hiddenContracts.length === this.contracts.length) ||
          this.hiddenContracts.includes(contractIdx))
      ) {
        this.orderFG.controls['contract'].setValue(null);
        return;
      }

      this.bundleQuantityChanges();
      this.buildSummary(this.orderFG.getRawValue());
    });
  }

  bundleQuantityChanges() {
    this.contractErrorMsg = '';

    if (this.actionType === 'view') {
      return;
    }

    const contract = this.orderFG.controls['contract'].value as Contract;

    if (!contract) {
      return;
    }

    const bundles = this.bundlesFA.getRawValue();
    const contractBundleItemMap = {};

    for (let i = 0; i < bundles.length; i++) {
      const formBundle = bundles[i];
      const bundle = this.bundleQuery.getOne(formBundle.id);

      for (let j = 0; j < bundle.items.length; j++) {
        const bItem = bundle.items[j];
        const cItem = contract.items.find(cItem => {
          return cItem.sku === (bItem.numberSku ?? bItem.sku);
        });
        const { activeUse, quantityLimit } = cItem;
        const activeUseAvailable = quantityLimit - activeUse;
        const bundleQuantity = formBundle.quantity * bItem.quantity;

        if (!!contractBundleItemMap[cItem.sku]) {
          contractBundleItemMap[cItem.sku].bundleQuantity += bundleQuantity;
        } else {
          contractBundleItemMap[cItem.sku] = {
            activeUseAvailable,
            bundleQuantity,
            name: cItem.name
          };
        }
      }
    }

    for (const key in contractBundleItemMap) {
      const { bundleQuantity, activeUseAvailable, name } = contractBundleItemMap[key];

      if (bundleQuantity > activeUseAvailable) {
        this.contractErrorMsg = `* ${name} exceeds the contract limit (${activeUseAvailable})`;
        break;
      }
    }
  }

  private async initUpdatingBunleData() {
    if (this._order) {
      const org = await this.orgService.getOrganizationByUuid(this._order.orgUuid).toPromise();
      this.orderFG.get('org').setValue(org);
      this.searchOrgInput.nativeElement.value = this.orgDisplayFn(org);

      this._order.bundles.forEach((b, i) => {
        const bundle = this.bundleQuery.getOne(b.id);
        if (bundle) {
          const g = this.fb.group({
            id: b.id,
            name: this.bundleQuery.getOne(b.id)?.name,
            quantity: [b.quantity, [Validators.required, Validators.min(1)]],
            deleted: bundle.status === BundleStatus.deleted
          });
          (this.orderFG.get('bundles') as UntypedFormArray).push(g);
          this.getBundlePrice(bundle, () => this.removeBundle(i));
        }
      });

      this.searchBundleFC.setValue('');

      this.selectedNumbers = this._order.numbers.map(n => new B3Number({ number: n.number, country: n.numberSku }));
      this._order.numbers.map(n => {
        (this.orderFG.get('numbers') as UntypedFormArray).push(this.fb.control({ ...n }));
      });
    }
    // approval will
    if (['approve', 'view'].includes(this.actionType)) {
      this.orderFG.disable();
    }
  }

  /**
   * Get all pricing for current bundle and ordered bundle
   * @param bundle
   */
  private getBundlePrice(bundle: Bundle, callback: () => void) {
    const bundleItems = bundle.items;
    const orderedItems = this._order?.bundles.find(b => b.id === bundle.id)?.items || [];

    let mergedItems: Array<BundleItem | OrderBundleItem> = [...bundleItems];
    const skus = mergedItems.map(i => (i.numberSku ? i.numberSku : i.sku));

    mergedItems = mergedItems.concat(
      ...orderedItems.filter(i => (i.numberSku ? !skus.includes(i.numberSku) : !skus.includes(i.sku)))
    );

    const streams = mergedItems.map(i => {
      const req = <GetPriceChangeReq>{ productCode: i.productId, sku: i.sku, saleModel: i.saleModelCode };
      if (i.numberSku) {
        req.productCode = i.numberProduct;
        req.sku = i.numberSku;
      }

      const key = buildPricingMappingKey(this.orderFG.get('org').value.uuid, req.productCode, req.sku);
      if (key in this._pricingMapping) {
        return of(this._pricingMapping[key]);
      }
      return this.pricingService.getPriceChain(req, this.orderFG.get('org').value.uuid).pipe(
        catchError(_ => {
          callback();
          this.toastr.error('Cannot get price');
          return of(null);
        }),
        tap(pricing => {
          if (pricing) {
            this._pricingMapping[key] = pricing;
          }
        })
      );
    });

    forkJoin(streams).subscribe(_ => {});
  }

  private buildSummary(order: HashMap<any>) {
    try {
      this.bundleChanged = false;

      const totalPrice = { finalPrice: 0, currency: 'SGD' };
      const summaryRows = [
        this.buildSummaryRow(
          'Customer',
          order['org']
            ? `${order['org']?.name} <span class="mat-caption font-normal">(${order['org']?.uuid.substr(0, 8)})</span> `
            : null
        )
      ];

      const bundleRows = [];
      const orderingBundles = order['bundles'] || [];
      const contract: Contract = order['contract'];
      const finalPriceMap: HashMap<number> = {};

      if (!orderingBundles.length) {
        bundleRows.push(`<div class="text-center help-text">Not available</div>`);
      } else {
        orderingBundles.forEach(orderingBundle => {
          bundleRows.push(
            `<li class="py-8 d-flex">
            <span class="text-truncate spacer mat-body-2">${orderingBundle.name}</span>
          </li>`
          );

          const bundle = this.bundleQuery.getOne(orderingBundle.id);
          if (bundle) {
            const orderedBundleItems = this._order?.bundles.find(ob => ob.id === orderingBundle.id)?.items || [];

            let summaryItems: Item[] = [];

            const newSelectedNumbers: string[] = this.selectedNumbers.map(n => n.number);
            const oldSelectedNumbers: string[] = this._order?.numbers?.map(n => n.number) || [];
            if (
              this.actionType === 'view' ||
              (this.actionType === 'approve' && arrayCompare(newSelectedNumbers, oldSelectedNumbers))
            ) {
              summaryItems = orderedBundleItems.map(oi => new Item(oi));
            } else if (this.actionType === 'create') {
              summaryItems = bundle.items.map(i => new Item(i));
            } else {
              const bundleItemSkus = bundle.items.map(bi => bi.numberSku || bi.sku);
              const orderredItemSkus = orderedBundleItems.map(oi => oi.numberSku || oi.sku);

              const sameItems = orderedBundleItems
                .filter(oi => bundleItemSkus.includes(oi.numberSku || oi.sku))
                .map(oi => {
                  return new Item({
                    ...oi,
                    newQuantity: bundle.items.find(bi => bi.sku === oi.sku && bi.numberSku === oi.numberSku)?.quantity
                  });
                });
              const removedItems = orderedBundleItems
                .filter(oi => !bundleItemSkus.includes(oi.numberSku || oi.sku))
                .map(oi => new Item({ ...oi, isRemoved: true }));

              const addedItems = bundle.items
                .filter(bi => !orderredItemSkus.includes(bi.numberSku || bi.sku))
                .map(bi => new Item({ ...bi, isNew: true }));

              summaryItems = [...sameItems, ...removedItems, ...addedItems];
              if (removedItems.length || addedItems.length || sameItems.some(i => i.isChanged)) {
                this.bundleChanged = true;
              }
            }

            const itemRows = [];

            summaryItems.forEach((i: Item) => {
              if (this.actionType !== 'view' && i.type === 'BASE' && order['excludeBase']) {
                return;
              }
              const itemPrice = this.getSkuPrice(order['org'], i);
              if (!itemPrice) {
                timer(300)
                  .pipe(take(1), takeUntil(this.destroySubscriber$))
                  .subscribe(_ => {
                    this.buildSummary(this.orderFG.getRawValue());
                  });

                throw { code: 'waiting to get price' };
              }
              if (itemPrice) {
                itemRows.push(
                  `<li class="py-8 ${
                    i.isRemoved ? 'red-fg' : i.isNew ? 'green-fg' : i.isChanged ? 'yellow-600-fg' : ''
                  }"><div class="d-flex">
                  <span class="text-truncate spacer">${itemPrice?.skuName}</span>
                  <span class="ml-8 ${!i.isRemoved && !i.isNew && !i.isChanged ? 'teal-fg' : ''} d-content-width">${
                    orderingBundle.quantity * i.rightQuantity
                  } ${
                    itemPrice ? ' x ' + this.currencyPipe.transform(itemPrice?.finalPrice, itemPrice?.currency) : ''
                  } </span>
                  </div></li>`
                );
                if (!i.isRemoved) {
                  finalPriceMap[i.numberSku || i.sku] =
                    itemPrice.finalPrice * orderingBundle.quantity * i.rightQuantity;
                  totalPrice.currency = itemPrice.currency;
                }
              }
            });
            if (itemRows.length) {
              bundleRows.push(`<ul>${itemRows.join('\n')}</ul>`);
            }
          }
        });
      }

      summaryRows.push(
        `<div class="container-fluid">`,
        `<div class="secondary-text pb-8">Bundle details</div>`,

        this.bundleChanged
          ? `<div class="d-flex justify-content-between mb-8">
              <div class="mat-caption font-normal"><span class="px-16 py-0 green mr-8"></span>Added item</div>
              <div class="mat-caption font-normal"><span class="px-16 py-0 yellow-600 mr-8"></span>Quantity change</div>
              <div class="mat-caption font-normal"><span class="px-16 py-0 red mr-8"></span>Removed item</div>
            </div>`
          : '',
        order['excludeBase']
          ? `<div class="px-16 py-8 mb-8 teal-200 mat-body-2 font-normal">Purchase add-ons only!</div>`
          : '',
        `<ul class="container-fluid px-16 pr-0 m-0">${bundleRows.join('\n')}</ul>`,
        `</div>`
      );

      if (this.totalNumberCount > 0) {
        const numberRows = [];
        const numbers = order['numbers'] as Array<HashMap<any>>;
        if (numbers && numbers.length) {
          numbers.forEach(n =>
            numberRows.push(
              `<li class="py-8 d-flex">
              <span class="text-truncate spacer">${n?.['number']}</span>
            </li>`
            )
          );
        } else {
          numberRows.push(`<div class="text-center help-text">Not available</div>`);
        }

        summaryRows.push(
          `<div class="container-fluid">`,
          `<div class="secondary-text pb-8">Selected numbers</div>`,
          `<ul class="container-fluid px-16 pr-0 m-0 selected__numbers" style="max-height: 216px; overflow: auto">
            ${numberRows.join('\n')}
          </ul>`,
          `</div>`
        );
      }

      const contractRows = [];

      if (contract && contract.items?.length) {
        contractRows.push(
          `
            <li class="py-8 d-flex">
              <span class="text-truncate spacer mat-body-2">${contract.contractNumber} (${contract.statusLabel})</span>
            </li>
          `
        );

        const itemRows = [];
        totalPrice.currency = contract.currency;

        contract.items.forEach(item => {
          const price = item.unitPriceTaxExcl + item.unitPriceTaxExcl * item.taxRate;
          let bundleItem: BundleItem;
          let quantity = 0;
          let finalPrice = 0;

          orderingBundles.forEach((orderingBundle, i) => {
            const bundle = this.bundleQuery.getOne(orderingBundle.id);
            bundleItem = bundle.items.find(b => item.sku === (b.numberSku ?? b.sku));

            if (!bundleItem && item.sku === NUMBER_SKU_CODE) {
              bundleItem = bundle.items.find(b => !!this.numberProducts.find(n => n.productId === b.numberProduct));
            }

            if (!bundleItem) {
              return;
            }

            quantity += orderingBundle.quantity * bundleItem.quantity;
            finalPrice += orderingBundle.quantity * bundleItem.quantity * price;
          });

          finalPriceMap[item.sku] = finalPrice;
          itemRows.push(
            `
              <li class="py-8">
                <div class="d-flex">
                  <span class="text-truncate spacer">${item.name}</span>
                  <span class="ml-8 d-content-width teal-fg">
                    ${quantity}
                    x
                    ${this.currencyPipe.transform(price, contract.currency)} 
                  </span>
                </div>
              </li>
            `
          );
        });

        if (itemRows.length) {
          contractRows.push(`<ul>${itemRows.join('\n')}</ul>`);
        }
      } else {
        contractRows.push(`<div class="text-center help-text">Not available</div>`);
      }

      summaryRows.push(
        `<div class="container-fluid">`,
        `<div class="secondary-text pb-8">Contract details</div>`,
        `<ul class="container-fluid px-16 pr-0 m-0">${contractRows.join('\n')}</ul>`,
        `</div>`
      );

      const prices = Object.values(finalPriceMap);
      const sum = prices.length ? prices.reduce((prev, curr) => prev + curr) : 0;
      totalPrice.finalPrice = sum;

      const orderFormFileRows = [];

      if (this.fileInfos.length) {
        this.fileInfos.forEach(file =>
          orderFormFileRows.push(
            `<li class="py-8 d-flex">
                <span class="text-truncate spacer">${file.name}</span>
                <span class="ml-8 d-content-width">${this.datePipe.transform(file.uploadedAt)}</span>
              </li>`
          )
        );
      }

      if (this.orderFormFiles.length) {
        this.orderFormFiles.forEach(file =>
          orderFormFileRows.push(
            `<li class="py-8 d-flex">
              <span class="text-truncate spacer">${file.name}</span>
            </li>`
          )
        );
      } else {
        if (!this.fileInfos.length) {
          orderFormFileRows.push(`<div class="text-center help-text">Not available</div>`);
        }
      }

      summaryRows.push(
        `<div class="container-fluid">`,
        `<div class="secondary-text pb-8">Order form</div>`,
        `<ul class="container-fluid px-16 pr-0 m-0 selected__numbers" style="max-height: 216px; overflow: auto">
            ${orderFormFileRows.join('\n')}
          </ul>`,
        `</div>`
      );

      let billingDateRow = '';
      const billingDate = this.orderFG.controls['billingStartDate'].value;

      if (billingDate) {
        billingDateRow = `<li class="py-8 d-flex">
                            <span class="text-truncate spacer">${this.datePipe.transform(billingDate)}</span>
                          </li>`;
      } else {
        billingDateRow = `<div class="text-center help-text">Not available</div>`;
      }

      summaryRows.push(
        `<div class="container-fluid">`,
        `<div class="secondary-text pb-8">Billing date</div>`,
        `<ul class="container-fluid px-16 pr-0 m-0 selected__numbers" style="max-height: 216px; overflow: auto">
                      ${billingDateRow}
                    </ul>`,
        `</div>`
      );

      summaryRows.push(
        `<div class="border-top container-fluid"></div>`,
        this.buildRowWithPricing(null, `Total`, totalPrice)
      );

      this.summaryHtml = summaryRows.join('\n');
    } catch (e) {
      console.error(e);

      // do nothing
    }
  }

  private buildSummaryRow(label, value: string, price?: PriceChain) {
    return [
      `<div class="container-fluid">${label ? '<div class="secondary-text pb-8">' + label + ':</div>' : ''}`,
      `<div class="d-flex container-fluid"><strong class="spacer">${value || 'N/A'}</strong>`,
      price ? `<span class="teal-fg">${this.currencyPipe.transform(price.finalPrice, price.currency)}</span>` : '',
      `</div></div>`
    ].join('\n');
  }

  private buildRowWithPricing(label, value: string, price: Partial<PriceChain>) {
    return [
      `<div class="container-fluid">${label ? '<div class="secondary-text pb-8">' + label + ':</div>' : ''}`,
      `<div class="d-flex container-fluid"><strong class="spacer">${value || 'N/A'}</strong>`,
      `<span class="teal-fg">${price ? this.currencyPipe.transform(price.finalPrice, price.currency) : 'NA'}</span>`,
      `</div></div>`
    ].join('\n');
  }

  private getSkuPrice(org: Organization, item: Item): PriceChain | null {
    if (!org || !item) {
      return null;
    }

    const productCode = item.numberSku ? item.numberProduct : item.productId;
    const sku = item.numberSku ? item.numberSku : item.sku;
    return this._pricingMapping[buildPricingMappingKey(org.uuid, productCode, sku)]; // this.saleModelMap[sku]?.find(s => s.saleModel === saleModel);
  }

  orderFormChange(fileInputEvent) {
    this.orderFormFiles.push(fileInputEvent.target.files[0]);
    this.buildSummary(this.orderFG.getRawValue());
  }

  removeOrderFormFile(index: number, name: string) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '560px',
        data: <ConfirmDialogInput>{
          title: `Remove file`,
          message: `This action cannot be revert, are you sure to remove file <strong>${name}</strong>? `,
          confirmLabel: `Remove`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.orderFormFiles.splice(index, 1);
          this.buildSummary(this.orderFG.getRawValue());
        }
      });
  }

  downloadFile(file: FileInfo) {
    file['downloading'] = true;

    this.fileService
      .downloadFileV3(file.s3Key)
      .pipe(finalize(() => (file['downloading'] = false)))
      .subscribe(res => {
        const downloadFile = new Blob([res.body], { type: `${res.body.type}` });
        const downloadUrl = URL.createObjectURL(downloadFile);

        donwloadFromUrl(downloadUrl, file.name, () => {
          URL.revokeObjectURL(downloadUrl);
        });
      });
  }

  checkDocument() {
    const numberSkuSG = this._order.numbers.find(number => number.numberSku === 'SG');

    if (!numberSkuSG) {
      this.checkDocumentRes = true;
      return;
    }

    this.numberService.checkDocument(numberSkuSG.numberSku, this._order.orgUuid).subscribe(res => {
      this.checkDocumentRes = res.length && res[0]?.valid;
    });
  }

  clearContract() {
    this.orderFG.controls['contract'].setValue(null);
  }
}
