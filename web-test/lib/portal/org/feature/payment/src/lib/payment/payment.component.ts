import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { SellerWallet, SellerWalletQuery, SellerWalletService } from '@b3networks/api/billing';
import { PortalConfig, PortalConfigQuery } from '@b3networks/api/partner';
import { AutoTopupSetting, PaymentService } from '@b3networks/api/payment';
import { LinkedSeller, LinkedSellerService } from '@b3networks/api/store';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable, combineLatest, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TopupFailureComponent } from './topup-failure/topup-failure.component';

@Component({
  selector: 'pop-payment',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent extends DestroySubscriberComponent implements OnInit {
  portalConfig: PortalConfig;
  autoTopupSettings: AutoTopupSetting;
  organization: ProfileOrg;
  isBlockAutoTopUpSub: boolean;

  sellerOrgs: LinkedSeller[];
  selectedSellerOrg: LinkedSeller;
  wallets$: Observable<SellerWallet[]>;

  isLoading = false;

  constructor(
    private paymentService: PaymentService,
    private portalConfigQuery: PortalConfigQuery,
    private profileQuery: IdentityProfileQuery,
    private sellerWalletQuery: SellerWalletQuery,
    private sellerWalletService: SellerWalletService,
    private linkedSellerService: LinkedSellerService,
    private dialog: MatDialog,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([
      this.paymentService.getAutoTopupSettings(),
      this.portalConfigQuery.portalConfig$,
      this.profileQuery.currentOrg$
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([autoTopupSettings, portalConfig, organization]) => {
        this.autoTopupSettings = autoTopupSettings;
        this.portalConfig = portalConfig;
        this.organization = organization;
        this.paymentService
          .getStatusAutoTopUpSubscription(organization.orgUuid)
          .subscribe(({ blockAutotopupForSubscription }) => (this.isBlockAutoTopUpSub = blockAutotopupForSubscription));
      });

    forkJoin([this.linkedSellerService.get(), this.sellerWalletService.getSellers()]).subscribe(
      ([sellerInfos, sellers]) => {
        this.sellerOrgs = sellers.map(uuid => sellerInfos.find(i => i.uuid === uuid)).filter(s => s != null);
        if (this.sellerOrgs.length) {
          this.selectedSellerOrg = this.sellerOrgs[0];
          this.wallets$ = this.sellerWalletQuery.selectWalletsBySeller(this.selectedSellerOrg.uuid);
        }
        const walletStreams = this.sellerOrgs.map(seller => this.sellerWalletService.getWallets(seller.uuid));
        forkJoin(walletStreams).subscribe(r => console.log(r));
      }
    );
  }

  onOrgChanged(event: MatTabChangeEvent) {
    this.selectedSellerOrg = this.sellerOrgs[event.index];
    this.wallets$ = this.sellerWalletQuery.selectWalletsBySeller(this.selectedSellerOrg.uuid);
  }

  onTopupResponse(result) {
    if (result?.error) {
      this.dialog.open(TopupFailureComponent, {
        width: '100%',
        height: '100%',
        minWidth: '100%',
        minHeight: '100%',
        data: result?.error
      });

      return;
    }

    this.toastr.success('Credit will be updated in a few seconds.');

    this._getPaymentSetting();
  }

  reloadData() {
    this.sellerWalletService.getSellers().subscribe();
    this._getPaymentSetting();
  }

  changedPaymentSettings() {
    this._getPaymentSetting();
  }

  private _getPaymentSetting() {
    this.paymentService.getAutoTopupSettings().subscribe(res => {
      this.autoTopupSettings = res;
    });
  }
}
