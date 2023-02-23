import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Seller, SkuMappingQuery, SkuMappingService, SupplierService } from '@b3networks/api/supplier';
import { DestroySubscriberComponent, downloadData, getFilenameFromHeader } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { SellerRoutingType } from 'libs/api/supplier/src/lib/seller-routing/seller-routing.model';
import { SkuMapping } from 'libs/api/supplier/src/lib/sku-mapping/sku-mapping.model';
import { cloneDeep } from 'lodash';
import { combineLatest } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { FilterSetting } from '../settings/filter-setting.model';
import { FilterSettingQuery } from '../settings/filter-setting.query';
import { FilterSettingService } from '../settings/filter-setting.service';
import { DeleteSkuMappingComponent } from './delete-sku-mapping/delete-sku-mapping.component';
import { ImportSkuMappingsComponent } from './import-sku-mappings/import-sku-mappings.component';
import { LoadPrefixesComponent } from './load-prefixes/load-prefixes.component';
import { UpdateSkuMappingComponent } from './update-sku-mapping/update-sku-mapping.component';

@Component({
  selector: 'b3n-sku-mapping',
  templateUrl: './sku-mapping.component.html',
  styleUrls: ['./sku-mapping.component.scss']
})
export class SkuMappingComponent extends DestroySubscriberComponent implements OnInit {
  dataSource = new MatTableDataSource<SkuMapping>();
  skuMappings: SkuMapping[];
  permission = true;
  isLoading: boolean = false;
  skuMappingsFiltered: SkuMapping[];
  displayColumns = ['name', 'productId', 'sku', 'type', 'srcPrefixes', 'destPrefixes', 'updatedDate', 'actions'];
  filterSetting: FilterSetting = {
    supplier: '',
    routing: '',
    mappings: ''
  };
  readonly routingTypesShow = SellerRoutingType;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private skuMappingService: SkuMappingService,
    private skuMappingQuery: SkuMappingQuery,
    private supplierService: SupplierService,
    private filterSettingQuery: FilterSettingQuery,
    private filterSettingService: FilterSettingService,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.supplierService.getSeller().subscribe(seller => {
      if (this.checkAuth(seller)) {
        this.skuMappingService.getSkuMappings().subscribe();
        combineLatest([this.filterSettingQuery.filterSetting$, this.skuMappingQuery.skuMappings$])
          .pipe(skip(1), takeUntil(this.destroySubscriber$))
          .subscribe(
            ([settings, skuMappings]) => {
              this.filterSetting = cloneDeep(settings);
              this.skuMappings = skuMappings;
              this.filterSkuMappings();
              this.isLoading = false;
            },
            error => {
              this.isLoading = false;
              this.toastService.error(error.message);
            }
          );
      } else {
        this.permission = false;
        this.isLoading = false;
      }
    });
  }

  reload() {
    this.isLoading = true;
    this.skuMappingService.getSkuMappings().subscribe(
      skuMappings => {
        this.skuMappings = skuMappings;
        this.filterSkuMappings();
        this.isLoading = false;
      },
      error => {
        this.toastService.error(error.message);
        this.isLoading = false;
      }
    );
  }

  onShowSkuMapping(sku?: SkuMapping) {
    this.dialog.open(UpdateSkuMappingComponent, {
      width: '500px',
      data: sku || null
    });
  }

  updateFilterSetting() {
    this.isLoading = true;
    this.filterSettingService.updatefilterSetting(this.filterSetting);
  }

  filterSkuMappings() {
    this.skuMappingsFiltered = cloneDeep(this.skuMappings);
    this.skuMappingsFiltered = this.skuMappingsFiltered.filter(sku =>
      sku.name.toLowerCase().includes(this.filterSetting.mappings.toLowerCase())
    );
    this.dataSource = new MatTableDataSource<SkuMapping>(this.skuMappingsFiltered);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 0);
  }

  loadMore(data) {
    this.dialog.open(LoadPrefixesComponent, {
      width: '500px',
      data: data
    });
  }

  showConfirmDelete(data) {
    this.dialog.open(DeleteSkuMappingComponent, {
      width: '500px',
      data: data
    });
  }

  checkAuth(seller: Seller) {
    let foundSupplier = seller.supportedSuppliers.find(supplier => supplier.supplierUuid === seller.uuid);
    return foundSupplier;
  }

  export() {
    this.skuMappingService.export().subscribe(res => {
      downloadData(new Blob([res.body], { type: 'text/csv;charset=utf-8;' }), getFilenameFromHeader(res.headers));
    });
  }

  import() {
    this.dialog
      .open(ImportSkuMappingsComponent, {
        width: '450px'
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.reload();
        }
      });
  }
}
