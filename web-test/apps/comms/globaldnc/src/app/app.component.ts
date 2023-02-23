import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CacheService } from './shared';

declare var X: any;
const OWNER_ROLES = ['OWNER', 'SUPER_ADMIN'];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  loading = true;

  constructor(private http: HttpClient, private cacheService: CacheService, private router: Router) {}

  ngOnInit() {
    forkJoin([
      this.http.get<any>(`/auth/private/v1/organizations/${X.orgUuid}`),
      this.http.get(`/auth/private/v1/identities`)
    ]).subscribe(
      ([org, identity]) => {
        const companyInfo = org;
        const identityInfo = identity;
        this.cacheService.put('user-info', {
          company: companyInfo,
          identity: identityInfo
        });
        forkJoin([
          this.http.get<any>(`/dnc/api/v2/private/subscriptions`),
          this.http.get<any>(
            `/sale-model/private/v1/products/dnc_lookup/skus/dnc_lookup/domainpricelist?currency=${companyInfo.currencyCode}&domain=${companyInfo.domain}`
          )
        ]).subscribe(
          res => {
            //let subscriptionInfo = res[0][0];
            //let priceInfo = res[0][1];
            //let discountInfo = res[1];

            const subscriptionInfo = res[0];
            const priceInfo = res[1];
            const discountInfo = {
              dnc: 0.0
            };

            const price = priceInfo.saleModel[0].domainPrice[0].amount;
            const discount = discountInfo.dnc;

            this.cacheService.put('price-info', {
              price: price,
              discount: discount,
              currency: companyInfo.currencyCode,
              real: Math.round((price - price * discount) * 1000) / 1000
            });

            subscriptionInfo.isAdmin = false;
            if (subscriptionInfo.subscription && subscriptionInfo.subscription.agentType) {
              subscriptionInfo.isAdmin = 'managerLicence'.indexOf(subscriptionInfo.subscription.agentType) > -1;
            }
            subscriptionInfo.isAdmin = subscriptionInfo.isAdmin || OWNER_ROLES.includes(subscriptionInfo.role);
            subscriptionInfo.isOwner = OWNER_ROLES.includes(subscriptionInfo.role);

            if (subscriptionInfo.subscription && subscriptionInfo.subscription.status == 'legacy') {
              subscriptionInfo.isLegacy = true;
              this.router.navigate(['compliance-window'], {
                queryParamsHandling: 'merge'
              });
            } else if (
              (subscriptionInfo.subscription && subscriptionInfo.subscription.status == 'terminated') ||
              (subscriptionInfo.dpoSubscription && subscriptionInfo.dpoSubscription.status == 'terminated')
            ) {
              subscriptionInfo.errorCode = 'subscriptionNotFound';
              this.router.navigate(['list-management'], {
                queryParamsHandling: 'merge'
              });
            } else if (subscriptionInfo.isOwner) {
              this.router.navigate(['compliance-window'], {
                queryParamsHandling: 'merge'
              });
            } else if (subscriptionInfo.isAdmin) {
              this.router.navigate(['check-number'], {
                queryParamsHandling: 'merge'
              });
            } else {
              this.router.navigate(['check-number'], {
                queryParamsHandling: 'merge'
              });
            }

            this.cacheService.put('subscription-info', subscriptionInfo);
            this.loading = false;
          },
          err => {
            const subscriptionInfo: any = {};
            err = err;
            if (err.code.indexOf('subscriptionNotFound') > -1) {
              subscriptionInfo.errorCode = 'subscriptionNotFound';
              this.router.navigate(['list-management'], {
                queryParamsHandling: 'merge'
              });
            } else if (err.code.indexOf('noPermissionOnSubscription') > -1) {
              subscriptionInfo.errorCode = 'noPermissionOnSubscription';
              this.router.navigate(['landing'], {
                queryParamsHandling: 'merge'
              });
            } else {
            }
            this.cacheService.put('subscription-info', subscriptionInfo);
            this.loading = false;
          }
        );
      },
      error => {
        X.showWarn(`Error because ${error.message.toLowerCase()}`);
      }
    );
  }
}
