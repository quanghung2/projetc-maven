import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import {
  CountryService,
  IdentityProfileQuery,
  IdentityProfileService,
  MeIamService,
  OrganizationService,
  ProfileOrg,
  TimezoneService
} from '@b3networks/api/auth';
import { FeatureService } from '@b3networks/api/license';
import { PortalConfig, PortalConfigQuery, PortalConfigService } from '@b3networks/api/partner';
import { PersonalSettingsService } from '@b3networks/api/portal';
import { IsdnNumberService } from '@b3networks/api/sim';
import { ActiveIframeService } from '@b3networks/api/workspace';
import { SessionService } from '@b3networks/portal/base/shared';
import { PORTAL_SETTING_ROUTE_LINK } from '@b3networks/portal/org/feature/settings';
import { APP_IDS, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ROUTES_MAP, ROUTE_LINK } from './shared/contants';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  hasPermisison: boolean;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private organizationService: OrganizationService,
    private identityProfileQuery: IdentityProfileQuery,
    private identityProfileService: IdentityProfileService,
    private personalSettingService: PersonalSettingsService,
    private portalConfigQuery: PortalConfigQuery,
    private portalConfigService: PortalConfigService,
    private meIamService: MeIamService,
    private timeZoneService: TimezoneService,
    private countryService: CountryService,
    private isdnNumberService: IsdnNumberService,
    private sessionService: SessionService,
    private activeIframeService: ActiveIframeService,
    private orgFeatureService: FeatureService
  ) {
    super();
    this.activeIframeService.initListenEvent(APP_IDS.ORG_MANAGEMENTS);
  }

  ngOnInit() {
    this.loading = true;
    this.router.events
      .pipe(
        filter(evt => evt instanceof NavigationEnd),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(() => {
        const params = this.activatedRoute.snapshot.queryParams;
        if (params['menu'] === PORTAL_SETTING_ROUTE_LINK.myinfo) {
          this.router.navigate(
            [
              ROUTE_LINK.settings + '/' + PORTAL_SETTING_ROUTE_LINK.myinfo,
              {
                verifyingStep: true
              }
            ],
            {
              queryParamsHandling: 'merge'
            }
          );
        } else if (params['menu'] === PORTAL_SETTING_ROUTE_LINK.callHistory) {
          this.router.navigate([ROUTES_MAP.call_history.key]);
        }
      });

    combineLatest([this.identityProfileQuery.currentOrg$, this.portalConfigQuery.portalConfig$])
      .pipe(filter(([profileOrg, config]) => !!profileOrg && config != null && !!Object.keys(config).length))
      .subscribe(
        ([org, config]) => {
          this.loading = false;
          this.hasPermisison = config.hasAtLeastOneItemToShow; // && org.isUpperAdmin;
          // this.addStripeJs(config, org);
        },
        _ => {
          this.loading = false;
        }
      );

    this.sessionService.getProfile().subscribe();

    this.identityProfileService.getProfile().subscribe();
    this.meIamService.get().subscribe();
    this.organizationService.getOrganizationByUuid(X.orgUuid).subscribe();
    this.personalSettingService.getPersonalSettings().subscribe();
    this.timeZoneService.getTimezone().subscribe();
    this.countryService.getCountry().subscribe();
    this.isdnNumberService.get().subscribe();
    this.portalConfigService.getPortalConfig().subscribe();
    this.registerCustomIcons();
    this.orgFeatureService.get().subscribe();
  }

  private addStripeJs(config: PortalConfig, org: ProfileOrg) {
    if ((config.allowTopup || org.isPartner) && !this.isExistedStripejs()) {
      const scriptV2 = document.createElement('script');
      scriptV2.type = 'text/javascript';
      scriptV2.src = 'https://js.stripe.com/v2/';
      document.head.appendChild(scriptV2);

      const scriptV3 = document.createElement('script');
      scriptV3.type = 'text/javascript';
      scriptV3.src = 'https://js.stripe.com/v3/';
      document.head.appendChild(scriptV3);
    }
  }

  private isExistedStripejs() {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length; i--; ) {
      if (scripts[i].src === 'https://js.stripe.com/v3/' || scripts[i].src === 'https://js.stripe.com/v2/') {
        return true;
      }
    }
    return false;
  }

  private registerCustomIcons() {
    const icons = [
      { name: 'member', icon: 'assets/svg/icons/member.svg' },
      { name: 'lock', icon: 'assets/svg/icons/lock-folder.svg' },
      { name: 'photo', icon: 'assets/svg/icons/photo.svg' },
      { name: 'api-key', icon: 'assets/svg/icons/api-key.svg' },
      { name: 'lock', icon: 'assets/svg/icons/lock-folder.svg' },
      { name: 'config', icon: 'assets/svg/icons/config.svg' },
      { name: 'pin', icon: 'assets/svg/icons/pin.svg' },
      { name: 'unpin', icon: 'assets/svg/icons/unpin.svg' },
      { name: 'application', icon: 'assets/svg/icons/application.svg' },
      { name: 'group', icon: 'assets/svg/icons/group.svg' },
      { name: 'singpass-logo', icon: 'assets/svg/icons/singpass_logo.svg' },
      { name: 'corppass-logo', icon: 'assets/svg/icons/myinfobiz_logo_inline.svg' },
      { name: 'singpass-btn', icon: 'assets/svg/icons/singpass_inline_button.svg' },
      { name: 'coprpass-btn', icon: 'assets/svg/icons/myinfobiz_inline.svg' }
    ];

    icons.forEach(x => {
      this.matIconRegistry.addSvgIcon(x.name, this.domSanitizer.bypassSecurityTrustResourceUrl(x.icon));
    });
  }

  updatePermission(event: boolean) {
    if (event) {
      this.hasPermisison = false;
    }
  }
}
