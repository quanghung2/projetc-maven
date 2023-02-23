import { Component, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IdentityProfileQuery,
  IdentityProfileService,
  OrganizationPolicyService,
  ProfileOrg
} from '@b3networks/api/auth';
import { ExtensionService as CCExtensionService } from '@b3networks/api/callcenter';
import { FeatureQuery, FeatureService, LicenseFeatureCode, MeQuery, MeService } from '@b3networks/api/license';
import { PersonalSettingsService } from '@b3networks/api/portal';
import { ActiveIframeService } from '@b3networks/api/workspace';
import { ADMIN_LINK, APP_LINK } from '@b3networks/portal/setting';
import { APP_IDS, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  profileOrg$: Observable<ProfileOrg>;
  hasPhoneLicense$: Observable<boolean>;
  orgHasBaseLicense$: Observable<boolean>;

  constructor(
    private profileQuery: IdentityProfileQuery,
    private profileService: IdentityProfileService,
    private extensionService: CCExtensionService,
    private meLicenseQuery: MeQuery,
    private meLicenseService: MeService,
    private orgFeatureQuery: FeatureQuery,
    private orgFeatureService: FeatureService,
    private personalSettingsService: PersonalSettingsService,
    private organizationPolicyService: OrganizationPolicyService,
    private activeIframeService: ActiveIframeService,

    private route: ActivatedRoute,
    private router: Router,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer
  ) {
    super();
    this.activeIframeService.initListenEvent(APP_IDS.APPLICATIONS_SETTING);
  }

  ngOnInit(): void {
    this.profileOrg$ = this.profileQuery.currentOrg$;
    this.hasPhoneLicense$ = this.meLicenseQuery.hasPhoneSystemLicense$;
    this.orgHasBaseLicense$ = this.orgFeatureQuery.selectAllFeatures$.pipe(
      map(features => {
        return (
          features.includes(LicenseFeatureCode.extension) ||
          features.includes(LicenseFeatureCode.auto_attendant) ||
          features.includes(LicenseFeatureCode.license_sip)
        );
      })
    );

    this.profileService.getProfile().subscribe();
    this.meLicenseService.getFeatures().subscribe();
    this.orgFeatureService.get().subscribe();
    this.extensionService.getAllExtenison().subscribe();
    this.organizationPolicyService.get(X.orgUuid).subscribe();
    this.personalSettingsService.getPersonalSettings().subscribe();

    this.route.queryParams.subscribe(params => {
      if (params?.['menu'] === 'microsoft-teams') {
        this.router.navigate([APP_LINK.admin, ADMIN_LINK.microsoftTeams]);
      }
    });

    this._registerCustomIcons();
  }

  private _registerCustomIcons() {
    const icons = [
      { name: 'photo', icon: 'assets/svg/icons/photo.svg' },
      { name: 'api-key', icon: 'assets/svg/icons/api-key.svg' },
      { name: 'config', icon: 'assets/svg/icons/config.svg' },
      { name: 'ip-phone', icon: 'assets/svg/icons/ip-phone.svg' }
    ];

    icons.forEach(x => {
      this.matIconRegistry.addSvgIcon(x.name, this.domSanitizer.bypassSecurityTrustResourceUrl(x.icon));
    });
  }
}
