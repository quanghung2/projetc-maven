import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import { SellerWalletQuery, SellerWalletService } from '@b3networks/api/billing';
import { LinkedSeller, LinkedSellerService } from '@b3networks/api/store';
import { TransactionInput } from '@b3networks/platform/shared';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'pot-transaction',
  templateUrl: './transaction.component.html',
  styleUrls: ['./transaction.component.scss']
})
export class TransactionComponent extends DestroySubscriberComponent implements OnInit {
  organization: ProfileOrg;
  sellerOrgs: LinkedSeller[];
  selectSellerCtrl = new UntypedFormControl();
  transactionInput: TransactionInput;

  constructor(
    private cdr: ChangeDetectorRef,
    private profileQuery: IdentityProfileQuery,
    private linkedSellerService: LinkedSellerService,
    private sellerWalletService: SellerWalletService,
    private sellerWalletQuery: SellerWalletQuery
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([
      this.profileQuery.currentOrg$,
      this.linkedSellerService.get(),
      this.sellerWalletService.getSellers()
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([organization, sellerInfos, sellers]) => {
        this.organization = organization;
        const walletStreams = sellers.map(sellerUuid => this.sellerWalletService.getWallets(sellerUuid));
        if (walletStreams.length > 0) {
          forkJoin(walletStreams).subscribe(_ => {
            this.sellerOrgs = sellers.map(uuid => sellerInfos.find(i => i.uuid === uuid)).filter(s => s != null);
            if (this.sellerOrgs.length) {
              this.selectSellerCtrl.setValue(this.sellerOrgs[0]);
            }
          });
        } else {
          this.sellerOrgs = [];
        }
      });

    this.selectSellerCtrl.valueChanges.subscribe((sellerOrg: LinkedSeller) => {
      this.transactionInput = null;
      this.cdr.detectChanges();
      this.sellerWalletQuery
        .selectWalletsBySeller(sellerOrg.uuid)
        .pipe(takeUntil(this.destroySubscriber$))
        .subscribe(sellerWallet => {
          this.transactionInput = {
            sellerUuid: sellerOrg.uuid,
            buyerUuid: X.orgUuid,
            timezone: this.organization.timezone,
            currency: sellerWallet[0].currency ?? this.organization.walletCurrencyCode
          };
        });
    });
  }
}
