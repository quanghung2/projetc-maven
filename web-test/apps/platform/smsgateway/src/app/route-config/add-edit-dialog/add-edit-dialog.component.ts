import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Organization, OrganizationService, QueryOrgReq } from '@b3networks/api/auth';
import { CallerIdService } from '@b3networks/api/callerid-verification';
import { ByoiRoute, ByoiRoutesService, Vendor } from '@b3networks/api/sms';
import { GetAvailableProductReq, Product, ProductService, ProductType, Sku, SkuService } from '@b3networks/api/store';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable, combineLatest, defer } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  startWith,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';

export interface AddEditDialogData {
  title: 'Edit' | 'Create';
  byoiRoute: ByoiRoute;
}

@Component({
  selector: 'b3n-add-edit-dialog',
  templateUrl: './add-edit-dialog.component.html',
  styleUrls: ['./add-edit-dialog.component.scss']
})
export class AddEditDialogComponent extends DestroySubscriberComponent implements OnInit {
  form: UntypedFormGroup;
  skus: Sku[] = [];
  organizations$: Observable<Organization[]>;
  products: Product[] = [];
  vendors: Vendor[] = [];
  organizations: Organization[] = [];
  senders: string[] = [];

  progressing: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddEditDialogData,
    public dialogRef: MatDialogRef<AddEditDialogComponent>,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private byoiRoutesService: ByoiRoutesService,
    private orgService: OrganizationService,
    private skuService: SkuService,
    private productService: ProductService,
    private callerIdService: CallerIdService
  ) {
    super();

    this.initForm();
  }

  async ngOnInit(): Promise<void> {
    this.byoiRoutesService.getVendors().subscribe(vendors => {
      this.vendors = vendors;
    });

    this.productService
      .geAvailableProducts(<GetAvailableProductReq>{ type: ProductType.telecom })
      .subscribe(products => {
        this.products = products.filter(p => p.productId.includes('sms-outgoing')); // TODO only support sms-outgoing for now
      });
  }

  async initForm() {
    const { vendor, backupVendor, srcPrefix, destPrefix, srcMatchingType, sku, enableMnpCheck, orgUuid, productCode } =
      this.data.byoiRoute ?? {};

    this.form = this.fb.group({
      vendor: ['', Validators.required],
      backupVendor: [''],
      srcPrefix: [srcPrefix, Validators.required],
      destPrefix: [destPrefix, Validators.required],
      srcMatchingType: [srcMatchingType || 'EXACT'],
      organization: [''],
      product: [''],
      sku: [sku],
      enableMnpCheck: [null]
    });

    if (this.data.byoiRoute != null && orgUuid !== '*') {
      this.orgService.getOrganizationByUuid(orgUuid).subscribe(org => {
        this.form.get('organization').setValue(org);
      });
    }

    this._listenFormControls();

    if (this.data.byoiRoute) {
      this.form.patchValue({
        product: productCode,
        enableMnpCheck,
        vendor,
        backupVendor
      });
    }
  }

  private _listenFormControls() {
    this.organizations$ = this.form.controls['organization'].valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      switchMap(async (value): Promise<Organization[]> => {
        let organizations: Organization[];

        if (value instanceof Organization) {
          this.senders = [];
          this.callerIdService.findSenders(value.uuid).subscribe(sender => {
            console.log(sender);
            this.senders = [].concat(...sender.map(d => d.sender)).sort((a, b) => a.localeCompare(b));
          });
          return organizations;
        } else {
          await this.orgService
            .queryOrgs(
              <QueryOrgReq>{
                keyword: value?.toLowerCase()
              },
              { page: 0, perPage: 10 }
            )
            .toPromise()
            .then(orgs => {
              organizations = orgs;
            });

          return organizations;
        }
      })
    );

    this.form.controls['product'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          this.skuService.getProductSkus(value).subscribe(skus => {
            this.skus = skus;
          });
        })
      )
      .subscribe();

    this.form.controls['srcMatchingType'].valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          if (this.data.byoiRoute && this.data.byoiRoute.srcMatchingType === value) {
            this.srcPrefix.setValue(this.data.byoiRoute.srcPrefix);
          } else {
            if (value === 'EXACT') {
              this.srcPrefix.setValue(this.senders[0]);
            } else {
              this.srcPrefix.reset('');
            }
          }
        })
      )
      .subscribe();

    this.srcPrefix.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          if (this.srcMatchingType.value !== 'PREFIX') {
            return;
          }

          if (this.hasNonNumericCharacters(value) && value !== '*') {
            this.srcPrefix.setValue(this.getNumericValue(value));
          }
        })
      )
      .subscribe();

    this.destPrefix.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(value => {
          if (this.hasNonNumericCharacters(value) && value !== '*') {
            this.destPrefix.setValue(this.getNumericValue(value));
          }
        })
      )
      .subscribe();

    this.enableMnpCheck.valueChanges
      .pipe(
        takeUntil(this.destroySubscriber$),
        distinctUntilChanged(),
        tap(enableMnpCheck => {
          if (enableMnpCheck) {
            this.backupVendor.setValidators(Validators.required);
          } else {
            this.backupVendor.removeValidators(Validators.required);
            this.backupVendor.reset();
          }

          this.backupVendor.updateValueAndValidity();
        })
      )
      .subscribe();

    combineLatest([this.vendor.valueChanges, this.backupVendor.valueChanges])
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(([vendor, backupVendor]) => !!vendor && !!backupVendor),
        tap(([vendor, backupVendor]) => {
          this.backupVendor.setErrors(
            vendor === backupVendor
              ? {
                  duplicated: true
                }
              : null
          );
        })
      )
      .subscribe();
  }

  save(): void {
    this.progressing = true;

    const { vendor, backupVendor, srcPrefix, destPrefix, srcMatchingType, organization, product, sku, enableMnpCheck } =
      this.form.getRawValue();

    const body: Partial<ByoiRoute> = {
      vendor,
      backupVendor,
      srcPrefix,
      destPrefix,
      srcMatchingType,
      orgUuid: organization?.uuid ?? '*',
      productCode: product,
      sku,
      enableMnpCheck
    };

    defer(() => {
      return this.data.title === 'Edit'
        ? this.byoiRoutesService.updateByoiRoutes(this.data.byoiRoute.id, body)
        : this.byoiRoutesService.createByoiRoutes(body);
    })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.toastService.success(`${this.data.title} route successfully`);
          this.dialogRef.close({ isAdd: this.data.title === 'Create' });
        },
        err => {
          this.toastService.warning(err.message);
        }
      );
  }

  displayOrgFn(org: Organization) {
    return org.name;
  }

  getNumericValue(value: string) {
    return (value as string)?.match(/[0-9]/g)?.join('') ?? '';
  }

  hasNonNumericCharacters(value: string) {
    return /[^0-9]/.test(value);
  }

  get srcMatchingType() {
    return this.form.controls['srcMatchingType'];
  }

  get srcPrefix() {
    return this.form.controls['srcPrefix'];
  }

  get destPrefix() {
    return this.form.controls['destPrefix'];
  }

  get vendor() {
    return this.form.controls['vendor'];
  }

  get backupVendor() {
    return this.form.controls['backupVendor'];
  }

  get enableMnpCheck() {
    return this.form.controls['enableMnpCheck'];
  }
}
