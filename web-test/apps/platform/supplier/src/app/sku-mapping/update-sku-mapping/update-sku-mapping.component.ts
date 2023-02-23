import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductService, Sku, SkuService } from '@b3networks/api/store';
import { SellerRoutingType, SkuMapping, SkuMappingService } from '@b3networks/api/supplier';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { Observable } from 'rxjs';
import { finalize, map, startWith, takeUntil } from 'rxjs/operators';
import { CreateProductSkuComponent, CreateProductSkuInput } from '../create-sku/create-sku.component';

const SKU_NOT_FOUND = 'store.DomainSKUNotFound';
@Component({
  selector: 'b3n-update-sku-mapping',
  templateUrl: './update-sku-mapping.component.html',
  styleUrls: ['./update-sku-mapping.component.scss']
})
export class UpdateSkuMappingComponent extends DestroySubscriberComponent implements OnInit {
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  readonly supportedTypes: SellerRoutingType[] = [
    SellerRoutingType.CALL_INCOMING,
    SellerRoutingType.CALL_OUTGOING,
    SellerRoutingType.FAX_INCOMING,
    SellerRoutingType.FAX_OUTGOING,
    SellerRoutingType.SMS_INCOMING,
    SellerRoutingType.SMS_OUTGOING
  ];
  ctaActionName = 'Create';

  skuMapping: SkuMapping;
  telcomProducts = [];

  supportedSKUs: Sku[] = [];
  filteredSkus$: Observable<Sku[]>;

  skuCtr: UntypedFormControl = new UntypedFormControl();

  addOnBlur = true;
  removable = true;
  loadingProduct = false;
  loadingSku = false;
  updating = false;

  showCreateNewSku = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public updatingSkuMapping: SkuMapping,
    private skuMappingService: SkuMappingService,
    private productService: ProductService,
    private skuService: SkuService,
    public dialogRef: MatDialogRef<UpdateSkuMappingComponent>,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {
    super();
    this.skuCtr.disable();
    if (updatingSkuMapping) {
      this.skuMapping = cloneDeep(updatingSkuMapping);
      this.ctaActionName = 'Update';
      this.getSkus(this.skuMapping.productId);
    } else {
      this.skuMapping = <SkuMapping>{
        name: '',
        sku: '',
        productId: '',
        type: null,
        destPrefixes: [],
        srcPrefixes: []
      };
    }
  }

  ngOnInit(): void {
    this.fetchTelcomProducts();
    this.filteredSkus$ = this.skuCtr.valueChanges.pipe(
      startWith(''),
      map(value => this.filterSkus(value))
    );
  }

  createProductSku() {
    const skuUuid = this.skuCtr.value.split(' ')[0];

    this.skuService.checkProductSku(this.skuMapping.productId, skuUuid).subscribe(
      res => {
        if (res) {
          return;
        }
      },
      err => {
        if (err.code === SKU_NOT_FOUND) {
          this.dialog
            .open(CreateProductSkuComponent, {
              data: <CreateProductSkuInput>{
                productId: this.skuMapping.productId,
                skuUuid: skuUuid
              },
              width: '500px'
            })
            .afterClosed()
            .subscribe(res => {
              this.getSkus(this.skuMapping.productId, true);
              this.skuMapping.sku = skuUuid;
            });
        }
      }
    );
  }

  updateSkuMapping() {
    this.updating = true;
    if (this.skuMapping.id) {
      this.skuMappingService
        .updateSkuMapping(this.skuMapping)
        .pipe(finalize(() => (this.updating = false)))
        .subscribe(
          res => {
            this.dialogRef.close(true);
            this.toastService.success(this.ctaActionName + ' successfully');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    } else {
      this.createSkuMapping();
    }
  }

  createSkuMapping() {
    if (typeof this.skuCtr.value === 'string') {
      this.skuMapping.sku = this.skuCtr.value;
    } else {
      this.skuMapping.sku = this.skuCtr.value.sku;
    }
    this.skuMappingService
      .createSkuMapping(this.skuMapping)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(
        res => {
          this.dialogRef.close(true);
          this.toastService.success(this.ctaActionName + ' successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  add(event: MatChipInputEvent, fieldName: string): void {
    const input = event.input;
    const value = event.value;
    const rexg = new RegExp('^([*]?|[0-9]*)$');
    if (rexg.test(value)) {
      if ((value || '').trim()) {
        if (fieldName === 'srcPrefixes') {
          this.skuMapping.srcPrefixes.push(value.trim());
        } else {
          this.skuMapping.destPrefixes.push(value.trim());
        }
      }
      if (input) {
        input.value = '';
      }
    } else {
      this.toastService.warning('Please match the number format ');
    }
  }

  remove(prefix: string, fieldName: string): void {
    if (fieldName === 'srcPrefixes') {
      const index = this.skuMapping.srcPrefixes.indexOf(prefix);
      if (index >= 0) {
        this.skuMapping.srcPrefixes.splice(index, 1);
      }
    } else {
      const index = this.skuMapping.destPrefixes.indexOf(prefix);
      if (index >= 0) {
        this.skuMapping.destPrefixes.splice(index, 1);
      }
    }
  }

  getSkus(productId: string, refesh?: boolean) {
    this.loadingSku = true;
    this.skuCtr.disable();
    this.skuService
      .getProductSkus(productId)
      .pipe(finalize(() => (this.loadingSku = false)))
      .subscribe(skus => {
        this.supportedSKUs = skus;
        if (this.ctaActionName === 'Update') {
          const found = this.supportedSKUs.find(e => e.sku === this.skuMapping.sku);
          this.skuCtr.setValue(found);
        } else {
          if (!refesh) {
            this.skuCtr.setValue('');
          }

          this.skuCtr.enable();
        }
      });
  }

  filterSkus(value: string) {
    this.showCreateNewSku = false;
    if (typeof value === 'string') {
      if (value) {
        const foundSku = this.supportedSKUs.find(s => s.sku === value);
        if (!foundSku) {
          this.showCreateNewSku = true;
        }
      }
      return this.supportedSKUs.filter(
        option =>
          option.name.toLowerCase().includes(value.trim().toLowerCase()) ||
          option.sku.toLowerCase().includes(value.trim().toLowerCase())
      );
    }
    return null;
  }

  private fetchTelcomProducts() {
    this.loadingProduct = true;
    this.productService
      .geAvailableProducts()
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.loadingProduct = false))
      )
      .subscribe(product => {
        this.telcomProducts = product.filter(p => p.type === 'TELECOM');
      });
  }

  displaySku(sku: Sku) {
    return sku ? sku.name : null;
  }
}
