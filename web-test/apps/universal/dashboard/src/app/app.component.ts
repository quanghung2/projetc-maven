import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IAM_DASHBOARD_ACTIONS,
  IAM_SERVICES,
  IdentityProfileService,
  MeIamQuery,
  MeIamService
} from '@b3networks/api/auth';
import { MeService } from '@b3networks/api/callcenter';
import { PersonalSettingsService } from '@b3networks/api/portal';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { APP_ROUTING_LINK } from './shared/constants';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  noPermission: boolean;
  isV2: boolean = true;

  readonly APP_ROUTING_LINK = APP_ROUTING_LINK;

  constructor(
    private profileService: IdentityProfileService,
    private iamQuery: MeIamQuery,
    private iamService: MeIamService,
    private router: Router,
    private personalSettingService: PersonalSettingsService,
    private route: ActivatedRoute,
    private meService: MeService
  ) {
    super();
  }

  ngOnInit() {
    this.profileService.getProfile().subscribe(async profile => {
      const org = profile.organizations[0];

      if (!org.licenseEnabled) {
        this.meService.get().subscribe();
        this.isV2 = false;
        this.checkPermission();
      } else {
        this.isV2 = true;
        const params = this.route.snapshot.queryParams;
        this.router.navigate([APP_ROUTING_LINK.dashboard2], { queryParams: params });
      }
    });

    this.personalSettingService.getPersonalSettings().subscribe();
  }

  // this app must grant permission to view
  // User have no permission will be denied
  private async checkPermission() {
    await this.iamService.get().toPromise();

    if (!this.iamQuery.hasGrantedAction(IAM_SERVICES.dashboard, IAM_DASHBOARD_ACTIONS.readOnly)) {
      this.noPermission = true;
      this.router.navigate([APP_ROUTING_LINK.permissionDenined]);
    } else {
      const route = this.router.url.split('/')[1];

      if (route !== APP_ROUTING_LINK.dashboard) {
        this.router.navigate([APP_ROUTING_LINK.dashboard]);
      }
    }
  }
}
