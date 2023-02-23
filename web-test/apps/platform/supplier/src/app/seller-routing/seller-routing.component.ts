import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SupplierAppSettings } from '@b3networks/api/portal';
import { SellerRoutingQuery } from '@b3networks/api/supplier';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { SellerRouting } from 'libs/api/supplier/src/lib/seller-routing/seller-routing.model';
import { SellerRoutingService } from 'libs/api/supplier/src/lib/seller-routing/seller-routing.service';
import { Supplier } from 'libs/api/supplier/src/lib/supplier/supplier.model';
import { cloneDeep } from 'lodash';
import { combineLatest } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { FilterSetting } from '../settings/filter-setting.model';
import { FilterSettingQuery } from '../settings/filter-setting.query';
import { FilterSettingService } from '../settings/filter-setting.service';
import { DeleteSellerRoutingComponent } from './delete-seller-routing/delete-seller-routing.component';
import { UpdateSellerRoutingComponent } from './update-seller-routing/update-seller-routing.component';

@Component({
  selector: 'b3n-seller-routing',
  templateUrl: './seller-routing.component.html',
  styleUrls: ['./seller-routing.component.scss']
})
export class SellerRoutingComponent extends DestroySubscriberComponent implements OnInit {
  dataSource = new MatTableDataSource<SellerRouting>();
  routings: SellerRouting[];
  supplierAppSettings: SupplierAppSettings;
  filterSetting: FilterSetting = {
    supplier: '',
    routing: '',
    mappings: ''
  };
  isLoading: boolean = true;
  routingsFiltered: SellerRouting[];
  displayColumns = ['supplier', 'type', 'orgUuid', 'updatedDate', 'action'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private sellerRoutingService: SellerRoutingService,
    private sellerRoutingQuery: SellerRoutingQuery,
    private dialog: MatDialog,
    private filterSettingQuery: FilterSettingQuery,
    private filterSettingService: FilterSettingService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.sellerRoutingService.getSellerRouting().subscribe();
    combineLatest([this.filterSettingQuery.filterSetting$, this.sellerRoutingQuery.sellerRoutings$])
      .pipe(skip(1), takeUntil(this.destroySubscriber$))
      .subscribe(([settings, routings]) => {
        this.filterSetting = cloneDeep(settings);
        this.routings = routings;
        this.filterRoutings();
        this.isLoading = false;
      });
  }

  reload() {
    this.isLoading = true;
    this.sellerRoutingService
      .getSellerRouting()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        routings => {
          this.isLoading = false;
          this.routings = routings;
          this.filterRoutings();
        },
        error => {
          this.toastService.error(error.message);
          this.isLoading = false;
        }
      );
  }

  onShowUpdateSellerRouting(supplier?: Supplier) {
    this.dialog.open(UpdateSellerRoutingComponent, {
      width: '400px',
      data: supplier || null
    });
  }

  updateFilterSetting() {
    this.isLoading = true;
    this.filterSettingService.updatefilterSetting(this.filterSetting);
  }

  showConfirmDelete(data) {
    this.dialog.open(DeleteSellerRoutingComponent, {
      width: '500px',
      data: data
    });
  }

  filterRoutings() {
    this.routingsFiltered = cloneDeep(this.routings);
    this.routingsFiltered = this.routingsFiltered.filter(routing =>
      routing.supplier.name.toLowerCase().includes(this.filterSetting.routing.toLowerCase())
    );

    this.dataSource = new MatTableDataSource<SellerRouting>(this.routingsFiltered);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 0);
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }
}
