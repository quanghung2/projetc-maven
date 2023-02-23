import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { IdentityProfileQuery, IdentityProfileService, ProfileOrg } from '@b3networks/api/auth';
import { Bundle, BundleQuery, BundleService } from '@b3networks/api/license';
import { Partner, PartnerService } from '@b3networks/api/partner';
import { Product, ProductService, TypeProduct } from '@b3networks/api/store';
import { DestroySubscriberComponent, DomainUtilsService } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-product',
  templateUrl: './products.component.html',
  styleUrls: ['./products.component.scss']
})
export class ProductComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  @ViewChild('bundlesTempl') bundlesTempl: TemplateRef<any>;
  @ViewChild('appsTempl') appsTempl: TemplateRef<any>;

  bundles$: Observable<Bundle[]>;
  apps: Product[] = [];
  appTypes: TypeProduct[] = [];
  currentOrg: ProfileOrg;
  loading = true;
  partner: Partner;

  constructor(
    private bundleQuery: BundleQuery,
    private bundleService: BundleService,
    private domainUtil: DomainUtilsService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private toastService: ToastService,
    private profileQuery: IdentityProfileQuery,
    private profileService: IdentityProfileService,
    private productService: ProductService,
    private partnerService: PartnerService
  ) {
    super();
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    this.partnerService.getPartnerByDomain({ forceLoad: true }).subscribe(partner => (this.partner = partner));
    this.profileService.getProfile().subscribe(_ => {
      this.profileQuery.currentOrg$
        .pipe(
          takeUntil(this.destroySubscriber$),
          tap(value => {
            this.currentOrg = value;

            if (this.currentOrg.licenseEnabled) {
              this.initBundles();
            }

            this.initApps();
          })
        )
        .subscribe();
    });
  }

  initBundles() {
    this.bundles$ = this.bundleQuery.selectAll();
    this.bundleService.getPublic(this.domainUtil.getPortalDomainv2).subscribe();
  }

  initApps() {
    this.productService
      .fetchTypes()
      .pipe(
        tap(data => {
          this.appTypes = this.currentOrg.licenseEnabled
            ? [
                {
                  type: 'BUNDLE',
                  name: 'BUNDLES',
                  totalCount: 0,
                  label: 'BUNDLE'
                },
                ...data
              ]
            : data;
        })
      )
      .subscribe(
        _ => {},
        error => {
          this.toastService.warning(error.message);
        }
      );
  }

  showAppDetail(product: Product) {
    this.router.navigate([product.getNameInUrlPath(), { id: product.productId }]);
  }

  selectedTabChange(e: MatTabChangeEvent) {
    if (this.currentOrg.licenseEnabled && e.index === 0) {
      return;
    }

    this.changeAppType(this.appTypes[e.index]);
  }

  changeAppType(type: TypeProduct) {
    this.loading = true;

    this.appTypes.forEach(t => (t['selected'] = false));
    type['selected'] = true;

    this.productService.fetchProducts(type.type).subscribe(
      apps => {
        this.apps = (
          type.type === 'APP'
            ? apps.filter(p => (this.currentOrg.licenseEnabled ? p.name === 'CPaaS' : p.name !== 'CPaaS'))
            : apps
        ).map(p => new Product(p));
      },
      error => {
        this.toastService.warning(error.message);
      }
    );
  }

  changeLoading(loading: boolean) {
    this.loading = loading;
  }
}
