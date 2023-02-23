import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ProfileOrg } from '@b3networks/api/auth';
import { Partner } from '@b3networks/api/partner';
import { Product, ProductService } from '@b3networks/api/store';
import { SubscribedProductService } from '@b3networks/api/subscription';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, flatMap } from 'rxjs/operators';
import { EstimatedPrice } from '../../../shared/service/estimated-price/estimated-price.model';
import { EstimatedPriceService } from '../../../shared/service/estimated-price/estimated-price.service';
import { ContactSalesComponent } from '../contact-sales/contact-sales.component';

declare var $: any;

@Component({
  selector: 'store-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss']
})
export class ProductDetailComponent implements OnInit {
  @Input() id: string;
  @Input() partner: Partner;
  @Input() currentOrg: ProfileOrg;

  @Output() changeLoading = new EventEmitter<boolean>();

  isLogined: boolean;
  activePhoto: string;
  currency: string;
  product: Product;
  estimatedPrice: EstimatedPrice;
  estimatingPrice: boolean;
  loading = true;
  error: any;
  canSubscribeTrial: boolean;
  viewDescription: boolean;

  @ViewChild('banner') bannerEleRef: ElementRef;
  @ViewChild('pageHeader') headerEleRef: ElementRef;

  constructor(
    public dialog: MatDialog,
    private router: Router,
    private estimatePriceService: EstimatedPriceService,
    private toastService: ToastService,
    private subscriptionService: SubscribedProductService,
    private productService: ProductService
  ) {}

  togleViewDescription(view: boolean) {
    this.viewDescription = view;
  }

  openContactSalesDialog(): void {
    this.dialog.open(ContactSalesComponent, {
      width: '550px',
      data: {
        product: this.product
      },
      autoFocus: false,
      panelClass: 'contact-sales__container'
    });
  }

  ngOnInit() {
    this.loading = true;

    this.productService
      .getProduct(this.id)
      .pipe(
        flatMap(product => {
          this.isLogined = this.currentOrg != null;
          this.product = product;

          if (this.product.description) {
            this.product.description = this.product.description.replace('style="', 'style="margin-top: 0 !important;');
            this.product.description = this.product.description
              .split(/\bfont-size:.*;/)
              .join('font-size: 13px !important;');
          }

          if (this.product.images && this.product.images.length > 0) {
            this.activePhoto = this.product.images[0];
          }

          this.currency = this.currentOrg ? this.currentOrg.walletCurrencyCode : this.partner.supportedCurrencies[0];

          return this.productService.fetchSkusWithPricing(this.id, this.currency);
        })
      )
      .subscribe(
        skus => {
          this.product.skus = skus;
          this.getEstimatedPrice();
        },
        error => {
          this.error = error;
          this.toastService.warning(error.message);
        },
        () => {
          this.loading = false;

          setTimeout(() => {
            this.changeLoading.emit(false);
          }, 300);
        }
      );

    this.checkCanSubscribeTrial(this.id);
  }

  purchase() {
    this.router.navigate([
      this.product.getNameInUrlPath(),
      { id: this.product.productId, type: this.product.type },
      'purchase'
    ]);
  }

  trialPurchase() {
    this.router.navigate([
      this.product.getNameInUrlPath(),
      { id: this.product.productId, trial: this.canSubscribeTrial, type: this.product.type },
      'purchase'
    ]);
  }

  getEstimatedPrice() {
    this.estimatingPrice = true;
    this.estimatePriceService
      .getEstimatePrice(this.product.productId, this.currency, this.product.type)
      .pipe(finalize(() => (this.estimatingPrice = false)))
      .subscribe(estimatedPrice => (this.estimatedPrice = estimatedPrice));
  }

  private checkCanSubscribeTrial(productId: string) {
    this.subscriptionService.canSubscribeTrial(productId).subscribe(res => (this.canSubscribeTrial = res.trial));
  }

  back() {
    this.router.navigate(['']);
  }
}
