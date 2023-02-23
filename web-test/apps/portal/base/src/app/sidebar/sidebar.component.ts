import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { ActivationEnd, Router } from '@angular/router';
import {
  IAM_SERVICES,
  IAM_UI_ACTIONS,
  IAM_UI_RESOURCES,
  IdentityProfile,
  MeIamService,
  OrganizationPolicyQuery,
  OrganizationPolicyService,
  ProfileOrg
} from '@b3networks/api/auth';
import { PersonalWhitelistEnabled, PersonalWhitelistService } from '@b3networks/api/dnc';
import { FeatureQuery, FeatureService, MeQuery, MeService } from '@b3networks/api/license';
import { PortalConfig, PortalConfigQuery } from '@b3networks/api/partner';
import { PersonalSettingsQuery, PersonalSettingsService, ReleaseNoteService } from '@b3networks/api/portal';
import {
  ApplicationQuery,
  ApplicationService,
  PortalApplication,
  PortalAppType,
  SessionQuery
} from '@b3networks/portal/base/shared';
import { B3_ORG_UUID, B3_UAT_ORG_UUID, DestroySubscriberComponent, EventMapName } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, lastValueFrom, Observable, of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, filter, map, share, startWith, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { LogoutDlg } from '../shared/modal/logout/logout.component';
import { SwitchOrganizationDialog } from '../shared/modal/switch-org/switch-org.component';
import { WindowMessageService } from '../shared/service/window-message.service';

interface SidebarData {
  profile: IdentityProfile;
  currentOrg: ProfileOrg;
  darkMode: boolean;
  hasServicedOrg: boolean;
  servicedOrgs: ProfileOrg[];
}

@Component({
  selector: 'b3n-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent extends DestroySubscriberComponent implements OnInit {
  data$: Observable<SidebarData>;
  portalConfig$: Observable<PortalConfig>;

  featuredApps$: Observable<PortalApplication[]>;
  applications$: Observable<Array<PortalApplication>>;
  filteredApplications$: Observable<PortalApplication[]>;

  currentOrgUuid: string;

  txtSearchApp: string;
  searchAppCtrl: UntypedFormControl = new UntypedFormControl();
  hasPinnedOrOpeningApp: boolean;
  hasApplication: boolean;
  hasPhoneSystemLicense$: Observable<boolean>;
  hasSupportCenter$: Observable<boolean>;
  appSupportCenter$: Observable<PortalApplication>;
  hasReleaseNote$: Observable<boolean>;
  hasStore$: Observable<boolean>;

  domain: string;

  appMenuHeight: number;

  contextMenuPosition = { x: '0px', y: '0px' };
  @ViewChild('clickHoverMenuTrigger', { read: MatMenuTrigger }) contextMenu: MatMenuTrigger;
  @ViewChild('appMenuElement') appMenuElement: ElementRef;
  @ViewChild('searchAppInput') searchAppInput: ElementRef;

  constructor(
    private sessionQuery: SessionQuery,
    private appQuery: ApplicationQuery,
    private appService: ApplicationService,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private iamPolicyQuery: OrganizationPolicyQuery,
    private iamPolicyService: OrganizationPolicyService,
    private assignedFeatureQuery: MeQuery,
    private assignedFeatureService: MeService,
    private assignedPermissionService: MeIamService,
    private toastService: ToastService,
    private windowService: WindowMessageService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private dialog: MatDialog,
    private orgFeatureQuery: FeatureQuery,
    private orgFeatureService: FeatureService,
    private releaseNoteService: ReleaseNoteService,
    private portalConfigQuery: PortalConfigQuery,
    private personalWhitelistService: PersonalWhitelistService
  ) {
    super();
  }

  ngOnInit() {
    this.router.events.subscribe(event => {
      if (event instanceof ActivationEnd) {
        this.currentOrgUuid = event.snapshot.params['orgUuid'];
      }
    });

    this.portalConfig$ = this.portalConfigQuery.portalConfig$;

    this.data$ = combineLatest([
      this.sessionQuery.profile$,
      this.sessionQuery.servicedOrgs$,
      this.sessionQuery.currentOrg$.pipe(tap(org => this.handleOrgChanged(org))),
      this.personalSettingQuery.darkMode$
    ]).pipe(
      filter(([profile, servicedOrgs]) => profile != null && servicedOrgs != null),
      map(([profile, servicedOrgs, currentOrg, darkMode]) => {
        if (environment.env === 'local') {
          this.domain = `https://${profile.domain}`;
        } else {
          this.domain = '';
        }

        return {
          profile: profile,
          currentOrg: currentOrg,
          darkMode: darkMode,
          hasServicedOrg: servicedOrgs.length > 0,
          servicedOrgs: servicedOrgs
        } as SidebarData;
      }),
      tap(data => {
        if (this.currentOrgUuid === undefined) {
          this.currentOrgUuid = data.currentOrg ? data.currentOrg.orgUuid : null;
        }
      })
    );
  }

  getIsShowOrgChartButton() {
    return this.currentOrgUuid === B3_ORG_UUID || this.currentOrgUuid === B3_UAT_ORG_UUID;
  }

  showSwitchOrganizationDialog() {
    this.dialog
      .open(SwitchOrganizationDialog, {
        width: '500px',
        position: {
          top: '40px'
        }
      })
      .afterClosed()
      .subscribe();
  }

  gotoManageProfile() {
    this.router.navigate([this.currentOrgUuid, 'account']);
  }

  gotoOrganizationChart() {
    this.router.navigate([this.currentOrgUuid, 'org-chart']);
  }

  openLogoutDialog() {
    this.dialog.open(LogoutDlg, {
      width: '500px',
      position: {
        top: '40px'
      }
    });
  }

  togglePinnedApp(app: PortalApplication, $event?) {
    if ($event) {
      $event.stopPropagation();
    }
    this.appService.togglePinnedApp(app).subscribe(
      _ => {},
      error => {
        const message = error.message;
        this.toastService.warning(message);
      }
    );
  }

  toggleDarkMode(dartMode: boolean, $event?: Event) {
    if ($event) {
      $event.stopPropagation();
    }

    this.personalSettingService.updateDarkMode(!dartMode).subscribe(res => {
      this.windowService.fireEventAllRegisters(EventMapName.updateDarkMode, res.darkMode, this.currentOrgUuid);
    });
  }

  stopPropagation(event) {
    event.stopPropagation();
  }

  trackApp(_: number, app: PortalApplication) {
    return app != null && app.id;
  }

  openContextMenu(event, app: PortalApplication) {
    event.preventDefault(); // Suppress the browser's context menu
    this.contextMenuPosition.x = event.clientX + 'px';
    this.contextMenuPosition.y = event.clientY + 'px';
    this.contextMenu.menuData = { item: app };
    this.contextMenu.menu.focusFirstItem('mouse');
    this.contextMenu.openMenu(); // Open your custom context menu instead
  }

  closeApp(app: PortalApplication) {
    this.appService.closeApp(app);

    if (this.appQuery.getActiveId() === app.id) {
      let previousApp = 'home';
      // reactivate previous opened app and close this app
      const openedApps = this.appQuery.getOpenedApps(app.orgUuid);
      if (openedApps && openedApps.length > 0) {
        previousApp = openedApps[0].portalAppPath;
      }
      this.router.navigate([this.currentOrgUuid, previousApp]);
    }
  }

  openApp(app: PortalApplication, $event?: any) {
    if ($event) {
      $event.stopPropagation();
    }
    if (app.shouldOpenNewTab) {
      const url = (this.domain || location.origin) + '/' + app.rightSourcePath;
      window.open(url, '_blank');
    } else {
      this.router.navigate([this.currentOrgUuid, app.portalAppPath]);
    }
  }

  openAppMenu(e: MouseEvent) {
    const appMenuHeightCurrent = this.appMenuElement.nativeElement.offsetHeight;

    const appMenuMaxHeight = window.innerHeight - e.clientY;
    this.appMenuHeight = appMenuHeightCurrent < appMenuMaxHeight ? appMenuHeightCurrent : appMenuMaxHeight;
    this.searchAppInput.nativeElement.focus();
  }

  private async handleOrgChanged(org: ProfileOrg) {
    if (org) {
      this.appMenuHeight = null;

      if (org.licenseEnabled) {
        // await org features and assigned features
        await Promise.all([
          lastValueFrom(this.orgFeatureService.get().pipe(catchError(() => of([]))), { defaultValue: [] }),
          lastValueFrom(this.assignedFeatureService.getFeatures().pipe(catchError(() => of([]))), { defaultValue: [] }),
          lastValueFrom(this.assignedPermissionService.get().pipe(catchError(() => of([]))), { defaultValue: [] }),
          lastValueFrom(this.assignedPermissionService.getAssignedGroup().pipe(catchError(() => of([]))), {
            defaultValue: []
          })
        ]);

        // await personal whitelist for contact
        const profile = this.sessionQuery.profile;
        const personalWhitelist = await lastValueFrom(
          this.personalWhitelistService
            .getByIdentityUuid(profile.uuid)
            .pipe(catchError(() => of(<PersonalWhitelistEnabled>{}))),
          {
            defaultValue: <PersonalWhitelistEnabled>{}
          }
        );
        this.personalWhitelistService.updateGrantPermission(personalWhitelist?.enabled);
      }

      await lastValueFrom(this.iamPolicyService.get(org.orgUuid).pipe(catchError(() => of([]))), { defaultValue: [] });

      if (!this.appQuery.isLoaded(org.orgUuid)) {
        await lastValueFrom(this.appService.initModulesAndApps(org).pipe(catchError(() => of([]))), {
          defaultValue: []
        });
      }

      this.applications$ = combineLatest([
        this.appQuery.selectApplications({
          orgUuid: org.orgUuid,
          installed: true,
          isFeature: false,
          type: PortalAppType.application
        }),
        this.orgFeatureQuery.selectExternalAppIDs$
      ]).pipe(
        map(([apps, externalAppIds]) =>
          apps.filter(app => app.isInstalled || (app.isExternalApp && externalAppIds.includes(app.appId)))
        ),
        tap(apps => {
          this.hasApplication = apps.length > 0;
          this.hasPinnedOrOpeningApp = apps.filter(app => app.pinned || app.opening).length > 0;
          this.changeDetectorRef.detectChanges();
        }),
        share()
      );

      this.featuredApps$ = this.appQuery
        .selectApplications({
          orgUuid: org.orgUuid,
          isFeature: true
        })
        .pipe(
          distinctUntilChanged()
          // map(apps => {
          //   return apps.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
          // })
        );

      this.filteredApplications$ = combineLatest([
        this.applications$,
        this.searchAppCtrl.valueChanges.pipe(startWith(''), debounceTime(200))
      ]).pipe(
        map(([apps, searchString]) => {
          searchString = searchString?.trim().toLowerCase() || '';

          return searchString ? apps.filter(a => a.name.toLowerCase().includes(searchString)) : apps;
        }),
        tap(_ => this.searchAppInput.nativeElement.focus()),
        share()
      );

      this.hasPhoneSystemLicense$ = org.licenseEnabled ? this.assignedFeatureQuery.hasPhoneSystemLicense$ : of(false);
      this.hasSupportCenter$ = this.iamPolicyQuery.selectHasGrantedResource(
        org.orgUuid,
        IAM_SERVICES.ui,
        IAM_UI_ACTIONS.display_sidebar_feature,
        IAM_UI_RESOURCES.supportCenter
      );
      this.appSupportCenter$ = this.appQuery.selectEntity(this.currentOrgUuid + '_SupportCenter');
      this.hasReleaseNote$ = this.releaseNoteService.fetchReleases().pipe(map(releases => releases?.length > 0));
      this.hasStore$ = this.iamPolicyQuery.selectHasGrantedResource(
        org.orgUuid,
        IAM_SERVICES.ui,
        IAM_UI_ACTIONS.display_sidebar_feature,
        IAM_UI_RESOURCES.store
      );
    }
  }
}
