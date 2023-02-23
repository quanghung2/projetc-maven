import { KeyValue } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  AuthenticationService,
  IAMGrantedPermission,
  IAMGroup,
  IAM_BILLING_ACTIONS,
  IAM_GROUP_UUIDS,
  IAM_SERVICES,
  IAM_SIM_ACTIONS,
  IAM_UI_ACTIONS,
  IAM_UI_RESOURCES,
  IdentityProfileQuery,
  MeIamQuery,
  MeIamService,
  MyInfo,
  Organization,
  OrganizationPolicyQuery,
  OrganizationPolicyService,
  OrganizationQuery,
  ProfileOrg
} from '@b3networks/api/auth';
import { DirectUpload } from '@b3networks/api/file';
import { FeatureQuery, LicenseFeatureCode } from '@b3networks/api/license';
import { PortalConfig, PortalConfigQuery } from '@b3networks/api/partner';
import { OrgTimeFormatSettingsComponent, UpdateOrgNameDialogComponent } from '@b3networks/portal/org/feature/settings';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, Observable, timer } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';
import { DEVELOPER_MAPS, ROUTES_MAP, ROUTE_LINK } from '../shared/contants';

export interface HomeTabGroupMapping {
  organization: Array<KeyValue<ROUTE_LINK | string, string>>;
}

@Component({
  selector: 'b3n-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent extends DestroySubscriberComponent implements OnInit {
  homeTabGroupOptions = [];
  progressing: boolean;
  organization$: Observable<Organization>;
  uploadEvent: DirectUpload;
  myInfo: MyInfo;
  dateTime$: Observable<Date>;

  @Output() hasNoMenuEvent = new EventEmitter<boolean>();

  constructor(
    private profileQuery: IdentityProfileQuery,
    private portalConfigQuery: PortalConfigQuery,
    private organizationQuery: OrganizationQuery,
    private organizationPolicyQuery: OrganizationPolicyQuery,
    private organizationPolicyService: OrganizationPolicyService,
    private authenticationService: AuthenticationService,
    private meIamQuery: MeIamQuery,
    private meIamService: MeIamService,
    private dialog: MatDialog,
    private router: Router,
    private orgFeatureQuery: FeatureQuery
  ) {
    super();
  }

  ngOnInit() {
    this.organization$ = this.organizationQuery.selectOrganization(X.orgUuid);
    this.authenticationService.getMyInfo().subscribe(myInfo => {
      this.myInfo = myInfo;
    });

    combineLatest([
      this.profileQuery.currentOrg$,
      this.portalConfigQuery.portalConfig$,
      this.organizationPolicyQuery.selectGrantedIAM(X.orgUuid, IAM_SERVICES.ui, IAM_UI_ACTIONS.show_org_menu),
      this.meIamService.getAssignedGroup()
    ])
      .pipe(
        filter(([org, config, _]) => org != null && config != null),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(([profileOrg, config, orgPolicy, iamGroups]) => {
        this.initSidebarData(profileOrg, config, orgPolicy, iamGroups);
      });

    this.organizationPolicyService.get(X.orgUuid).subscribe();
    this.dateTime$ = timer(0, 1000).pipe(map(() => new Date()));
  }

  private initSidebarData(
    profileOrg: ProfileOrg,
    portalConfig: PortalConfig,
    orgPolicy: IAMGrantedPermission,
    iamGroups: IAMGroup[]
  ) {
    let mapping: HomeTabGroupMapping;
    const hasMangeOrgSettingPermission =
      profileOrg.licenseEnabled &&
      profileOrg.isUpperAdmin &&
      iamGroups.some(group => group.uuid === IAM_GROUP_UUIDS.organizationSetting);
    if (profileOrg.isPartner) {
      mapping = this.initPartnerTabs(profileOrg, orgPolicy, hasMangeOrgSettingPermission);
    } else {
      mapping = this.initCustomerTabs(profileOrg, portalConfig, orgPolicy, hasMangeOrgSettingPermission);
    }

    this.homeTabGroupOptions = Object.entries(mapping).map(([name, value]) => {
      switch (name) {
        case 'organization': {
          return ['Organization', value];
        }
      }
      return null;
    });

    if (mapping.organization.length === 0) {
      this.hasNoMenuEvent.emit(true);
      return;
    }

    const hasMemberMenu = mapping.organization.includes(ROUTES_MAP.members);
    if (!hasMemberMenu) {
      this.router.navigate([mapping.organization[0].key]);
    }
  }

  uploadPhotoEvent(event: DirectUpload) {
    this.uploadEvent = event;
  }

  openTimeZoneSettings() {
    this.dialog.open(OrgTimeFormatSettingsComponent, {
      width: '400px',
      autoFocus: false
    });
  }

  updateOrgName() {
    this.dialog.open(UpdateOrgNameDialogComponent, {
      width: '500px'
    });
  }

  private initPartnerTabs(org: ProfileOrg, orgPolicy: IAMGrantedPermission, hasMangeOrgSettingPermission: boolean) {
    const mapping = <HomeTabGroupMapping>{
      organization: [
        ROUTES_MAP.members,
        ROUTES_MAP.billing_address,
        ROUTES_MAP.payment,
        ROUTES_MAP.myinfo,
        ROUTES_MAP.usage_history,
        ROUTES_MAP.transactions
      ]
    };

    if (orgPolicy?.hasResource(IAM_UI_RESOURCES.org_team)) {
      mapping.organization.push(ROUTES_MAP.teams);
    }
    if (org.licenseEnabled) {
      mapping.organization.push(ROUTES_MAP.licenses);
    }

    if (org.licenseEnabled && (org.isOwner || hasMangeOrgSettingPermission)) {
      mapping.organization.push(ROUTES_MAP.org_link);
    }

    mapping.organization.sort((a, b) => (a.value > b.value ? 1 : -1));

    return mapping;
  }

  // https://b3networks.atlassian.net/browse/UI-1092
  // https://b3networks.atlassian.net/browse/UI-1751
  /**
   * Init customer tabs with some restricted
   * Supported for subscription model & license model
   * License model need to follow UI-1751
   *
   * @param profileOrg
   * @param portalConfig
   * @param orgPolicy
   */
  private initCustomerTabs(
    profileOrg: ProfileOrg,
    portalConfig: PortalConfig,
    orgPolicy: IAMGrantedPermission,
    hasMangeOrgSettingPermission: boolean
  ) {
    const mapping = <HomeTabGroupMapping>{
      organization: []
    };

    if (portalConfig.showMember) {
      mapping.organization.push(ROUTES_MAP.members);
    }

    if (profileOrg.isUpperAdmin) {
      if (orgPolicy?.hasResource(IAM_UI_RESOURCES.org_team)) {
        mapping.organization.push(ROUTES_MAP.teams);
      }
      if (
        (!profileOrg.licenseEnabled || profileOrg.isOwner || hasMangeOrgSettingPermission) &&
        orgPolicy?.hasResource(IAM_UI_RESOURCES.org_billing_address)
      ) {
        mapping.organization.push(ROUTES_MAP.billing_address);
      }
      if (
        (!profileOrg.licenseEnabled || profileOrg.isOwner || hasMangeOrgSettingPermission) &&
        portalConfig.showPricing
      ) {
        mapping.organization.push(ROUTES_MAP.payment);
      }
      if (profileOrg.licenseEnabled) {
        // license has other action to manage
        mapping.organization.push(ROUTES_MAP.licenses);
      } else if (portalConfig.showSubscription) {
        mapping.organization.push(ROUTES_MAP.subscriptions);
      }

      if (
        (!profileOrg.licenseEnabled || profileOrg.isOwner || hasMangeOrgSettingPermission) &&
        portalConfig.showInvoice
      ) {
        mapping.organization.push(ROUTES_MAP.invoices);
      }
      if (
        (!profileOrg.licenseEnabled || profileOrg.isOwner || hasMangeOrgSettingPermission) &&
        portalConfig.showUsageHistory
      ) {
        mapping.organization.push(ROUTES_MAP.usage_history);
      }
      if (
        (!profileOrg.licenseEnabled || profileOrg.isOwner || hasMangeOrgSettingPermission) &&
        portalConfig.showAudit
      ) {
        mapping.organization.push(ROUTES_MAP.audit);
      }
      if (
        (!profileOrg.licenseEnabled || profileOrg.isOwner || hasMangeOrgSettingPermission) &&
        orgPolicy?.hasResource(IAM_UI_RESOURCES.org_myinfo)
      ) {
        mapping.organization.push(ROUTES_MAP.myinfo);
      }
      if (profileOrg.licenseEnabled && (profileOrg.isOwner || hasMangeOrgSettingPermission)) {
        mapping.organization.push(ROUTES_MAP.org_link);
      }

      if (profileOrg.licenseEnabled && (profileOrg.isOwner || hasMangeOrgSettingPermission)) {
        mapping.organization.push(ROUTES_MAP.public_holiday);
      }

      this.orgFeatureQuery.selectAllFeatures$
        .pipe(
          filter(features => features != null && features.length > 0),
          take(1)
        )
        .subscribe(features => {
          if (
            profileOrg.licenseEnabled &&
            (profileOrg.isOwner || hasMangeOrgSettingPermission) &&
            (features.includes(LicenseFeatureCode.extension) || features.includes(LicenseFeatureCode.license_sip))
          ) {
            mapping.organization.push(ROUTES_MAP.inbound_call_rule);
          }

          if (
            profileOrg.licenseEnabled &&
            (profileOrg.isOwner || hasMangeOrgSettingPermission) &&
            (features.includes(LicenseFeatureCode.auto_attendant) ||
              features.includes(LicenseFeatureCode.extension) ||
              features.includes(LicenseFeatureCode.license_sip))
          ) {
            mapping.organization.push(ROUTES_MAP.outbound_call_rule);
          }
        });

      // HS need check to other action
      if (
        profileOrg.licenseEnabled &&
        (profileOrg.isOwner || hasMangeOrgSettingPermission) &&
        this.organizationPolicyQuery.hasGrantedResource(
          X.orgUuid,
          IAM_SERVICES.ui,
          IAM_UI_ACTIONS.enableUWFeature,
          IAM_UI_RESOURCES.hyperspace
        )
      ) {
        mapping.organization.push(ROUTES_MAP.hyperspace_management);
      }
    }

    // only support for old pricing
    // and apply for all members has permission
    if (!profileOrg.licenseEnabled) {
      if (orgPolicy?.hasResource(IAM_UI_RESOURCES.org_call_history)) {
        mapping.organization.push(ROUTES_MAP.call_history);
      }
      if (this.meIamQuery.hasGrantedAction(IAM_SERVICES.sim, IAM_SIM_ACTIONS.update_number_configuration)) {
        mapping.organization.push(ROUTES_MAP.compliance);
      }
      // report show for all members has permission
      if (
        this.meIamQuery.hasGrantedAction(IAM_SERVICES.billing, IAM_BILLING_ACTIONS.view_reports) &&
        portalConfig.showReport
      ) {
        mapping.organization.push(ROUTES_MAP.report);
      }

      if (profileOrg.isUpperAdmin) {
        if (orgPolicy?.hasResource(IAM_UI_RESOURCES.org_api)) {
          mapping.organization.push(DEVELOPER_MAPS.apiKeys);
        }
        if (orgPolicy?.hasResource(IAM_UI_RESOURCES.org_webhooks)) {
          mapping.organization.push(DEVELOPER_MAPS.webhooks);
        }
      }
    }

    mapping.organization.sort((a, b) => (a.value > b.value ? 1 : -1));

    return mapping;
  }
}
