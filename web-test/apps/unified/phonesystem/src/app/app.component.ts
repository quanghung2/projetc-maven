import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CountryService,
  IdentityProfileQuery,
  IdentityProfileService,
  MeIamService,
  OrganizationPolicyService,
  ProfileOrg
} from '@b3networks/api/auth';
import { ExtensionService as CCExtensionService } from '@b3networks/api/callcenter';
import { FeatureQuery, FeatureService, LicenseFeatureCode, MeQuery, MeService } from '@b3networks/api/license';
import { PersonalSettingsService } from '@b3networks/api/portal';
import { ADMIN_LINK, APP_LINK } from '@b3networks/portal/setting';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
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
    private assignedGroupPermission: MeIamService,
    private route: ActivatedRoute,
    private router: Router,
    private countryService: CountryService
  ) {
    super();
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
    this.countryService.getCountry().subscribe();
    this.profileService.getProfile().subscribe();
    this.meLicenseService.getFeatures().subscribe();
    this.orgFeatureService.get().subscribe();
    this.extensionService.getAllExtenison().subscribe();
    this.organizationPolicyService.get(X.orgUuid).subscribe();
    this.personalSettingsService.getPersonalSettings().subscribe();
    this.assignedGroupPermission.getAssignedGroup().subscribe();

    this.route.queryParams.subscribe(params => {
      if (params?.['menu'] === 'microsoft-teams') {
        this.router.navigate([APP_LINK.admin, ADMIN_LINK.microsoftTeams]);
      }
    });
  }
}
