import { Component, OnInit, ViewChild } from '@angular/core';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';
import { MatStepper } from '@angular/material/stepper';
import { ActivatedRoute, Router } from '@angular/router';
import { OrganizationService } from '@b3networks/api/auth';
import { Wallet, WalletService } from '@b3networks/api/billing';
import { GetAllProductReq, GetSkuReq, Product, ProductService, Sku, SkuService } from '@b3networks/api/store';
import { RecoveryResponseV2, SubscriptionService } from '@b3networks/api/subscription';
import { SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { combineLatest, forkJoin } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-recover-subscription',
  templateUrl: './recover-subscription.component.html',
  styleUrls: ['./recover-subscription.component.scss']
})
export class RecoverSubscriptionComponent implements OnInit {
  horizontalPosition: MatSnackBarHorizontalPosition = 'end';
  verticalPosition: MatSnackBarVerticalPosition = 'top';
  subscriptions: RecoveryResponseV2[] = [];
  subscriptionsSelected: RecoveryResponseV2[] = [];

  loading: boolean;
  isProcess: boolean;
  totalAmount: number;
  wallet: Wallet;
  orgUuid: string;
  recoverUuid: string;

  @ViewChild('recoverSteper') recoverSteper: MatStepper;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private subscriptionService: SubscriptionService,
    private organizationService: OrganizationService,
    private walletService: WalletService,
    private snakBar: MatSnackBar,
    private sessionQuery: SessionQuery,
    private sessionService: SessionService,
    private productService: ProductService,
    private skuService: SkuService
  ) {}

  ngOnInit() {
    this.loading = true;
    combineLatest([this.route.params, this.sessionQuery.profile$])
      .pipe(filter(([params, profile]) => params['orgUuid'] && profile != null))
      .subscribe(
        ([params, profile]) => {
          this.orgUuid = params['orgUuid'];
          this.recoverUuid = params['recoverUuid'];
          const org = profile.getOrganizationByUuid(params['orgUuid']);
          if (org) {
            this.sessionService.switchOrg(org);
            this.getRecover();
          } else {
            this.router.navigate(['/']);
            this.loading = false;
          }
        },
        error => (this.loading = false)
      );
  }

  getRecover() {
    forkJoin([
      this.subscriptionService.getRecoveryV2(this.recoverUuid),
      this.organizationService.getOrganizationByUuid(this.orgUuid),
      this.walletService.getWallet()
    ]).subscribe(
      ([recovers, org, wallet]) => {
        this.subscriptions = recovers || [];
        this.wallet = wallet;

        if (this.subscriptions.length) {
          this.totalAmount = this.subscriptions.map(item => item.amount).reduce((a, b) => a + b);
          const productIds = this.subscriptions.map(item => item.primaryProductId);
          const observables = [];
          const request: GetAllProductReq = {
            productIds: productIds,
            includeDescription: false
          };
          observables.push(this.productService.getAllProduct(org.domain, request));

          productIds.forEach(productId => {
            const requestSku: GetSkuReq = {
              productId: productId,
              filter: 'PRIMARY_ONLY'
            };
            observables.push(this.skuService.fetchSkus(org.domain, requestSku));
          });

          forkJoin(observables)
            .pipe(finalize(() => (this.loading = false)))
            .subscribe(data => {
              this.subscriptions.forEach(subscription => {
                subscription.isSelected = true;
                const product = (data[0] as Product[]).find(item => item.productId === subscription.primaryProductId);
                subscription.primaryProductName = product.name;

                const index = productIds.indexOf(subscription.primaryProductId);

                const sku = (data[index + 1] as Sku[]).find(item => item.sku === subscription.primarySku);

                subscription.primarySkuName = sku?.name || '';
              });
            });
        } else {
          this.loading = false;
        }
      },
      error => {
        this.loading = false;
      }
    );
  }

  onComplete() {
    if (this.isNotCheckedAny()) {
      return;
    }

    const recoveredSubscriptions: RecoveryResponseV2[] = this.subscriptions.filter(x => x.isSelected);
    const subscriptionIds = recoveredSubscriptions.map(item => item.subscriptionUuid);
    const ignoredSubscriptionUuids = this.subscriptions
      .filter(item => !item.isSelected)
      .map(item => item.subscriptionUuid);

    this.isProcess = true;
    this.subscriptionService
      .subscriptionRecoverV2(subscriptionIds, this.recoverUuid, ignoredSubscriptionUuids)
      .pipe(finalize(() => (this.isProcess = false)))
      .subscribe(
        () => {
          this.subscriptionsSelected = [...recoveredSubscriptions];
          this.recoverSteper.next();
        },
        error => {
          if (error.status === 400) {
            this.showMessageError(error.message);
            return;
          }

          const message = 'Sorry, an error has occurred when we try to fulfill your request. Please try again later.';
          this.showMessageError(message);
        }
      );
  }

  showMessageError(message: string) {
    this.snakBar.open(message, '', {
      horizontalPosition: this.horizontalPosition,
      verticalPosition: this.verticalPosition,
      panelClass: ['recover-error']
    });
  }

  isNotCheckedAny() {
    return this.subscriptions.every(x => !x.isSelected);
  }

  goToHome() {
    this.router.navigate(['/']);
  }

  onTopup() {
    this.getRecover();
  }
}
