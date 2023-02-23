import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Organization, OrganizationService } from '@b3networks/api/auth';
import { BuyerWallet, WalletService } from '@b3networks/api/billing';
import { Partner, PartnerService } from '@b3networks/api/partner';
import { Channel, ChannelQuery, Product, ProductService } from '@b3networks/api/store';
import { TransactionInput } from '@b3networks/platform/shared';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { forkJoin } from 'rxjs';
import { filter, finalize, switchMap, take, takeUntil } from 'rxjs/operators';
import { AddProductInput, AddProductModalComponent } from '../add-product-modal/add-product-modal.component';
import { EditTagInput, EditTagModalComponent } from '../edit-tag-modal/edit-tag-modal.component';
import {
  ExportSubscriptionInput,
  ExportSubscriptionModalComponent
} from '../export-subscription-modal/export-subscription-modal.component';
import { ConvertPaymentComponent, ConvertPaymentInput } from './convert-payment/convert-payment.component';
import { CreditLimitDialogComponent, CreditLimitInput } from './credit-limit-dialog/credit-limit-dialog.component';
import { TransactionDialogComponent } from './transaction-dialog/transaction-dialog.component';

@Component({
  selector: 'b3n-details-channel',
  templateUrl: './details-channel.component.html',
  styleUrls: ['./details-channel.component.scss']
})
export class DetailsChannelComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns = ['id', 'productName', 'type', 'selling'];

  channel: Channel;
  loading: boolean;
  loadingAvailableProduct: boolean;
  buyerTag: HashMap<string>;
  buyerWallets: BuyerWallet[] = [];
  selectedWallet: BuyerWallet;
  partnerUuid: string;
  allProducts: Product[] = [];
  dataSource = new MatTableDataSource<Product>();
  availableProducts: Product[] = [];
  sellingProducts: Product[] = [];
  isSelectedSelling: boolean;
  organization: Organization;
  partner: Partner;
  selectedCurrency: string;
  searchValue: string;

  readonly ObjectsKeys = Object.keys;

  get getAllProducts() {
    const productId = this.availableProducts?.map(product => product.productId);
    return this.allProducts.filter(sellingProduct => !productId.includes(sellingProduct.productId)) || [];
  }

  constructor(
    private dialog: MatDialog,
    private activatedRoute: ActivatedRoute,
    private channelQuery: ChannelQuery,
    private walletService: WalletService,
    private toastService: ToastService,
    private productService: ProductService,
    private organizationService: OrganizationService,
    private partnerService: PartnerService
  ) {
    super();
  }

  ngOnInit(): void {
    this.activatedRoute.paramMap
      .pipe(
        switchMap(param => {
          this.loading = true;

          const { params } = param as any;
          this.partnerUuid = params['partnerUuid'];
          return this.channelQuery.selectEntity(this.partnerUuid).pipe(filter(channel => channel != null));
        })
      )
      .pipe(
        switchMap(channel => {
          this.channel = channel;

          return forkJoin([
            this.productService.geAvailableProducts(),
            this.productService.getDistributingProducts(channel.domain),
            this.walletService.getBuyerTag(channel.partnerUuid),
            this.walletService.getBuyerWallet(channel.partnerUuid),
            this.organizationService.getOrganizationByUuid(X.orgUuid),
            this.partnerService.getPartnerByDomain({ forceLoad: true })
          ]);
        })
      )
      .pipe(take(1))
      .pipe(finalize(() => (this.loading = false)))
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([availableProducts, distributingProducts, buyerTag, buyerWallet, organization, partner]) => {
        [this.allProducts, this.availableProducts, this.buyerTag, this.buyerWallets, this.organization, this.partner] =
          [availableProducts, distributingProducts, buyerTag, buyerWallet, organization, partner];
        this.sellingProducts = distributingProducts.filter(item => item.selling);
        if (this.isSelectedSelling) {
          this.updateDataSource(this.sellingProducts);
          return;
        }
        this.updateDataSource(this.availableProducts);
        if (this.buyerWallets.length) {
          this.selectedWallet = this.buyerWallets.find(w => w.currency === this.partner.supportedCurrencies[0]);
          this.selectedCurrency = this.selectedWallet?.currency ?? this.partner.supportedCurrencies[0];
        }
      });
  }

  exportSubscription() {
    this.dialog.open(ExportSubscriptionModalComponent, {
      width: '500px',
      data: <ExportSubscriptionInput>{
        email: this.channel?.owner?.email,
        domain: this.channel?.domain,
        products: this.availableProducts
      }
    });
  }

  onEditTab() {
    this.dialog
      .open(EditTagModalComponent, {
        width: '500px',
        disableClose: true,
        data: <EditTagInput>{ buyerTag: this.buyerTag, parnerUuid: this.partnerUuid }
      })
      .afterClosed()
      .subscribe(res => {
        if (res && res.success) {
          this.getBuyerTag(this.partnerUuid);
        }
      });
  }

  onConvertPayment() {
    this.dialog
      .open(ConvertPaymentComponent, {
        width: '430px',
        disableClose: true,
        data: <ConvertPaymentInput>{
          buyerWallet: this.selectedWallet ? this.selectedWallet : null,
          partnerUuid: this.partnerUuid
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.getWallet(this.partnerUuid);
        }
      });
  }

  onOpenTransaction() {
    this.dialog.open(TransactionDialogComponent, {
      height: '100%',
      width: '100%',
      minWidth: '100%',
      minHeight: '100%',
      data: <TransactionInput>{
        sellerUuid: X.orgUuid,
        buyerUuid: this.partnerUuid,
        timezone: this.organization.timezone,
        currency: this.selectedWallet ? this.selectedWallet.currency : this.organization.currencyCode
      },
      panelClass: ['transaction-dialog']
    });
  }

  onShowAddProduct() {
    this.dialog
      .open(AddProductModalComponent, {
        width: '500px',
        disableClose: true,
        data: <AddProductInput>{
          products: this.getAllProducts,
          domain: this.channel.domain
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          if (res.success) {
            this.getDistributingProduct(this.channel.domain);
            this.toastService.success('Products have been added successfully');
            return;
          }

          this.toastService.error('There was an error adding the product. Please try again in a few minutes');
        }
      });
  }

  copied() {
    this.toastService.success('Copied successfully');
  }

  copyFailed() {
    this.toastService.error('Failed to copy');
  }

  formatAbs(currency: number) {
    return Math.abs(currency);
  }

  onChangeSellingProduct(isChecked: boolean) {
    this.isSelectedSelling = isChecked;
    if (this.isSelectedSelling) {
      this.updateDataSource(this.sellingProducts);
      return;
    }

    this.updateDataSource(this.availableProducts);
  }

  onSearchProduct(event) {
    const text: string = event.target.value;
    if (text?.trim().length) {
      let products: Product[] = [];

      if (this.isSelectedSelling) {
        products = this.filterProduct(this.sellingProducts, text);
      } else {
        products = this.filterProduct(this.availableProducts, text);
      }

      this.updateDataSource(products);
      return;
    }

    if (this.isSelectedSelling) {
      this.updateDataSource(this.sellingProducts);
      return;
    }

    this.updateDataSource(this.availableProducts);
  }

  private filterProduct(product: Product[], text: string): Product[] {
    const data = product.filter(item => {
      if (
        item.name?.toLowerCase().includes(text.toLowerCase()) ||
        item.productId?.toLowerCase() === text.toLowerCase()
      ) {
        return item;
      }
      return null;
    });

    return data;
  }

  private getDistributingProduct(domain: string) {
    this.loading = true;
    this.productService
      .getDistributingProducts(domain)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(product => {
        this.availableProducts = product;
        this.sellingProducts = product.filter(item => item.selling);
        if (this.isSelectedSelling) {
          this.updateDataSource(this.sellingProducts);
          return;
        }

        this.updateDataSource(this.availableProducts);
      });
  }

  private getBuyerTag(buyerUuid: string) {
    this.walletService.getBuyerTag(buyerUuid).subscribe(buyerTags => {
      this.buyerTag = buyerTags;
    });
  }

  private getWallet(buyerUuid: string) {
    this.walletService.getBuyerWallet(buyerUuid).subscribe(buyerWallets => {
      this.buyerWallets = buyerWallets;
      if (this.selectedWallet) {
        this.selectedWallet = this.buyerWallets.find(w => w.currency === this.selectedWallet.currency);
      } else {
        this.selectedWallet = this.buyerWallets[0];
      }
    });
  }

  private updateDataSource(product: Product[]) {
    this.dataSource = new MatTableDataSource<Product>(product);
    this.dataSource.paginator = this.paginator;
  }

  openCreditLimitDialog() {
    const tempSelectedWallet = new BuyerWallet({
      creditLimit: 0,
      currency: this.selectedCurrency
    });

    this.dialog
      .open(CreditLimitDialogComponent, {
        width: '400px',
        data: <CreditLimitInput>{
          partnerUuid: this.partnerUuid,
          buyerWallet: this.selectedWallet ?? tempSelectedWallet
        }
      })
      .afterClosed()
      .subscribe(result => {
        if (result) {
          this.getWallet(this.partnerUuid);
          this.selectedWallet = tempSelectedWallet;
        }
      });
  }

  reset() {
    this.searchValue = '';
    this.getDistributingProduct(this.channel.domain);
  }

  onSelectChanged(event) {
    this.selectedWallet = this.buyerWallets.find(w => w.currency === event.value);
    this.selectedCurrency =
      this.selectedWallet?.currency ?? this.partner.supportedCurrencies.find(c => c === event.value);
  }
}
