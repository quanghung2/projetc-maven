import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router } from '@angular/router';
import { SupplierSeller, SupplierService } from '@b3networks/api/supplier';
import { DISTRIBUTION_DOMAINS, DomainUtilsService } from '@b3networks/shared/common';
import { filter, finalize } from 'rxjs/operators';
import { DefaultSupplierComponent } from './default-supplier/default-supplier.component';

@Component({
  selector: 'b3n-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  links: KeyValue<string, string>[] = [];
  activeLink: KeyValue<string, string>;
  isDomainB3: boolean;
  defaultSupplierUuid: SupplierSeller;
  supportsSupplier: SupplierSeller[];
  fallbackSupplier: SupplierSeller;
  tooltipText: string;
  isLoadingDefault = false;

  constructor(
    private router: Router,
    private supplierService: SupplierService,
    private domainUtilSerivce: DomainUtilsService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.isDomainB3 = DISTRIBUTION_DOMAINS.includes(this.domainUtilSerivce.getPortalDomain());
    this.links = [];
    if (this.isDomainB3) {
      this.links = [
        { key: 'supplier', value: 'Suppliers' },
        { key: 'plan', value: 'Plans' }
      ];
      this.browseTo(this.links[0]);
    } else {
      this.links = [
        { key: 'routing', value: 'Routing' },
        { key: 'skumapping', value: 'SKU Mapping' }
      ];
      this.loadSeller();
    }

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      const matches = this.links.map(l => l.key);

      const evt = <NavigationEnd>e;
      for (const match of matches) {
        if (evt.url.indexOf(match) > -1) {
          this.activeLink = this.links.find(l => l.key === match);
        }
      }
    });
  }

  browseTo(l: KeyValue<string, string>) {
    this.activeLink = l;
    this.router.navigate([l.key]);
  }

  loadSeller() {
    this.isLoadingDefault = true;
    this.supplierService
      .getSeller()
      .pipe(finalize(() => (this.isLoadingDefault = false)))
      .subscribe(seller => {
        this.defaultSupplierUuid = seller.defaultSupplier;
        this.supportsSupplier = seller.supportedSuppliers;
        this.fallbackSupplier = seller.fallbackSupplier;
        if (this.fallbackSupplier) {
          this.tooltipText = `If a call cannot be found in the mapping of SKU-prefix below, it will be routed to ${this.fallbackSupplier.name}`;
        } else {
          this.tooltipText = 'Mapping SKU-prefix will follow your own settings';
        }
        this.checkAuth();
      });
  }

  showDefaultSupplier() {
    this.dialog
      .open(DefaultSupplierComponent, {
        width: '400px'
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.loadSeller();
        }
      });
  }

  checkAuth() {
    if (this.supportsSupplier.length < 2) {
      let index = this.links.findIndex(l => l.key === 'routing');
      if (index > -1) {
        this.links.splice(index, 1);
      }
    }
    if (this.activeLink && this.links.find(l => l.key === this.activeLink.key)) {
      this.browseTo(this.activeLink);
    } else {
      this.browseTo(this.links[0]);
    }
  }
}
