import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SupplierAppSettings } from '@b3networks/api/portal';
import { ParamForMapping, Supplier, SupplierQuery, SupplierService } from '@b3networks/api/supplier';
import { DestroySubscriberComponent, DISTRIBUTION_DOMAINS, DomainUtilsService } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { combineLatest } from 'rxjs';
import { skip, takeUntil, tap } from 'rxjs/operators';
import { FilterSetting } from '../settings/filter-setting.model';
import { FilterSettingQuery } from '../settings/filter-setting.query';
import { FilterSettingService } from '../settings/filter-setting.service';
import { DefaultSupplierComponent } from './default-supplier/default-supplier.component';
import { UpdateSupplierComponent } from './update-supplier/update-supplier.component';

@Component({
  selector: 'b3n-supplier',
  templateUrl: './supplier.component.html',
  styleUrls: ['./supplier.component.scss']
})
export class SupplierComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  suppliers: Supplier[];
  suppliersFiltered: Supplier[];
  dataSource = new MatTableDataSource<Supplier>();
  isDomainB3: boolean;
  defaultSupplierUuid: string;
  displayColumns = ['uuid', 'name', 'plan', 'visibilityType', 'updatedDate', 'action'];
  filterSetting: FilterSetting = {
    supplier: '',
    routing: '',
    mappings: ''
  };
  supplierAppSettings: SupplierAppSettings;
  isLoading: boolean = true;
  selectedSupplierUuid: string;
  showMappingRef: boolean;
  showRouting: boolean;
  paramForMapping: ParamForMapping[] = [];

  constructor(
    private supplierService: SupplierService,
    private supplierQuery: SupplierQuery,
    private dialog: MatDialog,
    private filterSettingQuery: FilterSettingQuery,
    private filterSettingService: FilterSettingService,
    private domainUtilSerivce: DomainUtilsService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.isDomainB3 = DISTRIBUTION_DOMAINS.includes(this.domainUtilSerivce.getPortalDomain());
    if (this.isDomainB3) {
      this.isLoading = true;
      this.supplierService.getSuppliers().subscribe();
      combineLatest([this.filterSettingQuery.filterSetting$, this.supplierQuery.suppliers$])
        .pipe(skip(1), takeUntil(this.destroySubscriber$))
        .subscribe(
          ([settings, suppliers]) => {
            this.filterSetting = cloneDeep(settings);
            this.suppliers = suppliers;
            this.filterSuppliers();
            this.isLoading = false;
          },
          error => {
            this.toastService.error(error.message);
            this.isLoading = false;
          }
        );
    }
  }

  reload() {
    this.isLoading = true;
    this.supplierService.getSuppliers().subscribe(
      suppliers => {
        this.suppliers = suppliers;
        this.filterSuppliers();
        this.isLoading = false;
      },
      error => {
        this.toastService.error(error.message);
        this.isLoading = false;
      }
    );
  }

  updateFilterSetting() {
    this.isLoading = true;
    this.filterSettingService.updatefilterSetting(this.filterSetting);
  }

  filterSuppliers() {
    this.suppliersFiltered = cloneDeep(this.suppliers);
    this.suppliersFiltered = this.suppliersFiltered.filter(sku =>
      sku.name.toLowerCase().includes(this.filterSetting.supplier.toLowerCase())
    );

    this.dataSource = new MatTableDataSource<Supplier>(this.suppliersFiltered);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 0);
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  manageDefaultSupplier(supplierUuid: string) {
    this.dialog.open(DefaultSupplierComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: supplierUuid
    });
  }

  manageRouting(supplierUuid: string) {
    this.selectedSupplierUuid = supplierUuid;
    this.showRouting = true;
  }

  setMappingRef(supplierUuid: string) {
    this.paramForMapping.length = 0;
    this.supplierService
      .getMappingReference(supplierUuid)
      .pipe(
        tap(res => {
          const productIds = [
            ...new Set(
              res.map(sku => {
                return `${sku.productId} - ${sku.type}`;
              })
            )
          ];
          productIds.forEach(p => {
            this.paramForMapping.push(
              new ParamForMapping({
                id: p,
                items: res.filter(sku => `${sku.productId} - ${sku.type}` == p)
              })
            );
          });
          this.selectedSupplierUuid = supplierUuid;
          this.showMappingRef = true;
        })
      )
      .subscribe();
  }

  onShowUpdateSupplier(supplier?: Supplier) {
    this.dialog.open(UpdateSupplierComponent, {
      width: '400px',
      disableClose: true,
      autoFocus: false,
      data: supplier || null
    });
  }
}
