import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { environment } from '../environments/environment';
import { User } from './shared/model';
import { SubscriptionService, TermService, UserService } from './shared/service';
import { NewComplianceService } from './shared/service/new-compliance.service';
import { SubscriptionLicenseService } from './shared/service/subscription-license.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  user: User;
  isManager = false;
  isCompliance = false;
  isLoading = true;
  // hungtn B3-984 [Call recording] Support app icon when user buys CR extensions from other apps
  //isSubscriptionLicense = false;

  constructor(
    private userService: UserService,
    private subscriptionService: SubscriptionService,
    private router: Router,
    private termService: TermService,
    private newComplianceService: NewComplianceService,
    private subscriptionLicense: SubscriptionLicenseService
  ) {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.isLoading = true;
    const findSubReq = {
      productId: environment.app.id,
      includeAssignees: true
    };

    forkJoin(
      this.termService.fetchTerm(),
      this.userService.getProfileV2(),
      this.subscriptionService.getCRSubscription(),
      this.newComplianceService.getAllOrganizationMembers(),
      this.subscriptionLicense.findSubscriptions(findSubReq)
    ).subscribe(
      (data: any[]) => {
        this.termService.setTerm(data[0]);
        this.user = data[1];
        this.user.isHasSub = data[2].length > 0;
        this.user.timezoneOffset = this.user.timezone.substr(3, 5);
        this.userService.setCurrentUserV2(this.user);

        this.initPermissionData(data);

        // hungtn B3-984 [Call recording] Support app icon when user buys CR extensions from other apps
        // if(!this.isSubscriptionLicense) {
        //   this.router.navigate(['/access-denied']);
        // } else
        if (!this.user.isHasSub) {
          this.router.navigate(['/access-denied']);
        } else {
          if (this.isCompliance) {
            this.router.navigate(['/managers']);
          } else if (this.isManager) {
            this.router.navigate(['/subscriptions']);
            // this.router.navigate(['/settings']);
          } else if (this.user.isHasSub) {
            this.router.navigate(['/history']);
          } else {
            this.router.navigate(['/page-not-found']);
          }
        }

        this.isLoading = false;
      },
      err => {
        this.isLoading = false;
      }
    );
  }

  initPermissionData(data: any) {
    if (!this.user) {
      this.isManager = false;
      this.isCompliance = false;
    } else {
      this.isManager = ['OWNER', 'ADMIN', 'SUPER_ADMIN'].indexOf(this.user.role) >= 0;
      this.isCompliance = this.user.complianceLicense != null && this.user.complianceLicense > 0;
    }
    // hungtn B3-984 [Call recording] Support app icon when user buys CR extensions from other apps
    // if (typeof data[4] != undefined && data[4].length > 0) {
    //   this.isSubscriptionLicense = true;
    // }
  }
}
