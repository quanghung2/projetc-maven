import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Organization, OrganizationService } from '@b3networks/api/auth';
import { SellerRoutingService, SupplierService } from '@b3networks/api/supplier';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import {
  CreateRoutingReq,
  SellerRouting,
  SellerRoutingType
} from 'libs/api/supplier/src/lib/seller-routing/seller-routing.model';
import { SupplierSeller } from 'libs/api/supplier/src/lib/supplier/supplier.model';
import { clone } from 'lodash';
import { combineLatest } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-seller-routing',
  templateUrl: './update-seller-routing.component.html',
  styleUrls: ['./update-seller-routing.component.scss']
})
export class UpdateSellerRoutingComponent extends DestroySubscriberComponent implements OnInit {
  newRouting: CreateRoutingReq;
  ctaActionName: string = 'Create';
  supportedSuppliers: SupplierSeller[];
  filteredOrg: Organization[];
  orgs: Organization[];
  loading = false;
  orgUuid: Organization;
  updating = false;

  readonly supportedTypes: SellerRoutingType[] = [
    SellerRoutingType.CALL_INCOMING,
    SellerRoutingType.CALL_OUTGOING,
    SellerRoutingType.FAX_INCOMING,
    SellerRoutingType.FAX_OUTGOING,
    SellerRoutingType.SMS_INCOMING,
    SellerRoutingType.SMS_OUTGOING
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA) public sellerRouting: SellerRouting,
    private sellerRoutingService: SellerRoutingService,
    private organizationService: OrganizationService,
    private supplierService: SupplierService,
    public dialogRef: MatDialogRef<UpdateSellerRoutingComponent>,
    private toastService: ToastService
  ) {
    super();
    this.initData(sellerRouting);
  }

  ngOnInit(): void {
    this.loading = true;
    combineLatest([this.supplierService.getSeller(), this.organizationService.findOrganizations()])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([seller, orgs]) => {
        this.supportedSuppliers = seller.supportedSuppliers.filter(
          suppler => suppler.supplierUuid !== seller.defaultSupplier.supplierUuid
        );
        this.orgs = orgs;
        const foundOrg = this.orgs.find(o => o.uuid === this.newRouting.orgUuid);
        if (foundOrg) {
          this.orgUuid = foundOrg;
        }
        this.filterOrg('');
        this.loading = false;
      });
  }

  updateSellerRouting() {
    this.updating = true;
    this.newRouting.orgUuid = this.orgUuid.uuid;
    if (this.ctaActionName == 'Update') {
      this.sellerRoutingService
        .updateSellerRouting(this.newRouting)
        .pipe(finalize(() => (this.updating = false)))
        .subscribe(
          res => {
            this.dialogRef.close(true);
            this.toastService.success('Update successfully');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    } else {
      this.sellerRoutingService
        .createSellerRouting(this.newRouting)
        .pipe(finalize(() => (this.updating = false)))
        .subscribe(
          res => {
            this.dialogRef.close(true);
            this.toastService.success('Create successfully');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    }
  }

  filterOrg(value: string) {
    const filterValue = value.toString() || '';
    this.filteredOrg = this.orgs.filter(
      org =>
        org.name.toLowerCase().includes(filterValue.toLowerCase()) ||
        org.uuid.toLowerCase().includes(filterValue.toLowerCase())
    );
  }

  customOrg(org) {
    return org ? org.name + ' - ' + org.uuid.slice(0, 8) : '';
  }

  initData(sellerRouting) {
    if (sellerRouting) {
      let sellerRoutingClone = clone(sellerRouting);
      this.newRouting = {
        orgUuid: sellerRoutingClone.orgUuid,
        type: sellerRoutingClone.type,
        supplierUuid: sellerRoutingClone.supplier.uuid
      };
      this.ctaActionName = 'Update';
    } else {
      this.newRouting = {
        orgUuid: '',
        type: null,
        supplierUuid: ''
      };
    }
  }
}
