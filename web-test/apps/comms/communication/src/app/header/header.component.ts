import { KeyValue } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfileQuery, ProfileOrg } from '@b3networks/api/auth';
import {
  FeatureQuery,
  FeatureService,
  LicenseFeatureCode,
  LicenseService,
  MeQuery,
  MeService
} from '@b3networks/api/license';
import {
  CommunicationAppSettings,
  PersonalSettingsQuery,
  PersonalSettingsService,
  StatisticMenu,
  UserMenu
} from '@b3networks/api/portal';
import { APP_IDS, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, of } from 'rxjs';
import { catchError, filter, takeUntil, tap } from 'rxjs/operators';
import { MENU_ROUTE_MAPS, RouteMap, ROUTE_LINK } from '../shared/contants';

export enum CallMenu {
  active_calls = 'active_calls',
  callback_requests = 'callback_requests',
  completed_calls = 'completed_calls'
}

export enum ChatMenu {
  assigned_chats = 'assigned-chats',
  pending_chats = 'pending-chats',
  completed_chats = 'completed-chats'
}

@Component({
  selector: 'b3n-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('users', { read: MatMenuTrigger, static: false }) usersMenuTrigger: MatMenuTrigger;
  @ViewChild('statistics', { read: MatMenuTrigger, static: false }) statisticMenuTrigger: MatMenuTrigger;
  @ViewChild('calls', { read: MatMenuTrigger, static: false }) callsMenuTrigger: MatMenuTrigger;
  @ViewChild('chats', { read: MatMenuTrigger, static: false }) chatsMenuTrigger: MatMenuTrigger;
  @ViewChild('compliances', { read: MatMenuTrigger, static: false }) compliancesMenuTrigger: MatMenuTrigger;

  readonly MENU_ROUTE_MAPS = MENU_ROUTE_MAPS;
  readonly ROUTE_LINK = ROUTE_LINK;

  displayMenus: RouteMap[] = [];
  loaded: boolean;
  hasSMSLicense: boolean;
  userMenus: KeyValue<UserMenu, string>[] = []; //supervisor
  statisticMenus: KeyValue<StatisticMenu, string>[] = []; //agent
  callsMenus: KeyValue<CallMenu, string>[] = [];
  chatsMenus: KeyValue<ChatMenu, string>[] = [];
  activeLink: RouteMap;
  personalSettings: CommunicationAppSettings;
  lastestUserMenu: UserMenu | StatisticMenu;
  selectedCallMenu: CallMenu;
  selectedChatMenu: ChatMenu;

  constructor(
    private profileQuery: IdentityProfileQuery,
    private router: Router,
    private route: ActivatedRoute,
    private featureService: FeatureService,
    private featureQuery: FeatureQuery,
    private meLicenseQuery: MeQuery,
    private meLicenseService: MeService,
    private licenseService: LicenseService,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService
  ) {
    super();
  }

  ngOnInit(): void {
    this.listenUserMenuChange();
    this.meLicenseService.getFeatures().subscribe(_ => {
      combineLatest([
        this.profileQuery.currentOrg$,
        this.featureService.get().pipe(catchError(__ => of([]))),
        this.licenseService
          .getLicenseFilterByFeature(LicenseFeatureCode.developer, LicenseFeatureCode.license_sms_campaign)
          .pipe(catchError(__ => of([])))
      ])
        .pipe(
          takeUntil(this.destroySubscriber$),
          filter(([org, features]) => org != null && features != null)
        )
        .subscribe(([profileOrg, orgFeatures, smsLicense]) => {
          this.hasSMSLicense = smsLicense?.length > 0;
          this.resetMenu();
          this.initSidebarData(profileOrg, orgFeatures);
        });
    });
  }

  private listenUserMenuChange() {
    this.personalSettingQuery.appSettings$
      .pipe(
        tap(apps => {
          this.personalSettings =
            <CommunicationAppSettings>(
              apps.find(app => app.orgUuid === X.orgUuid && app.appId === APP_IDS.COMMUNICATION_HUB)
            ) || <CommunicationAppSettings>{ orgUuid: X.orgUuid, appId: APP_IDS.COMMUNICATION_HUB };
          this.lastestUserMenu = this.personalSettings.users || UserMenu.performance;
        })
      )
      .subscribe();
  }

  private initSidebarData(profileOrg: ProfileOrg, _: string[]) {
    const menus: RouteMap[] = [MENU_ROUTE_MAPS['call_histories'], MENU_ROUTE_MAPS['sms_histories']];

    if (this.featureQuery.hasPhoneSystemBaseLicense || this.featureQuery.hasDeveloperLicense) {
      // history should open for all members when org has phone system || dev license

      if (this.featureQuery.hasPhoneSystemBaseLicense) {
        const isSupervisor =
          this.meLicenseQuery.hasCallCenterSupervisorLicense ||
          (this.meLicenseQuery.hasCallCenterEnabledLicense && this.profileQuery.currentOrg.isUpperAdmin) ||
          (profileOrg.isOwner &&
            (this.featureQuery.hasCallCenterSupervisorLicense || this.featureQuery.hasCallCenterEnabledLicense));
        const isAgent =
          this.meLicenseQuery.hasContactCenterLicense ||
          (profileOrg.isOwner && this.featureQuery.hasContactCenterLicense);

        if (isAgent) {
          if (!isSupervisor) {
            menus.push(MENU_ROUTE_MAPS['statistics']);
            this.statisticMenus.push(
              {
                key: StatisticMenu.activity_log,
                value: 'Activity Logs'
              },
              {
                key: StatisticMenu.assigned_calls,
                value: 'Assigned Calls'
              }
            );
          }
          this.userMenus.push({ key: UserMenu.activity_log, value: 'Activity Logs' });
        }

        // supervisor can see these menus
        if (isSupervisor) {
          menus.push(MENU_ROUTE_MAPS['users'], MENU_ROUTE_MAPS['calls'], MENU_ROUTE_MAPS['notes']);
          this.userMenus.unshift({ key: UserMenu.performance, value: 'Performance' });
          this.callsMenus.push(
            { key: CallMenu.active_calls, value: 'Active Calls' },
            { key: CallMenu.callback_requests, value: 'Callback Requests' },
            { key: CallMenu.completed_calls, value: 'Completed Calls' }
          );
        }

        if (menus.includes(MENU_ROUTE_MAPS['users'])) {
          this.userMenus.push({ key: UserMenu.assigned_calls, value: 'Assigned Calls' });
        }
      }
    }

    if (this.meLicenseQuery.hasLiveChatLicense) {
      menus.push(MENU_ROUTE_MAPS['chats']);
      if (profileOrg.isUpperAdmin) {
        this.chatsMenus.push(
          { key: ChatMenu.assigned_chats, value: 'Assigned Chats' },
          { key: ChatMenu.pending_chats, value: 'Pending Chats' }
        );
      }
      this.chatsMenus.push({ key: ChatMenu.completed_chats, value: 'Completed Chats' });
    }

    if (this.meLicenseQuery.hasPhoneSystemLicense) {
      if (this.meLicenseQuery.hasDPOLicense) {
        menus.push(MENU_ROUTE_MAPS['compliance']);
      }

      if (this.meLicenseQuery.hasBulkFilteringLicense) {
        menus.push(MENU_ROUTE_MAPS['bulk_filtering']);
      }
    }

    // campaign opened for org has campaign license && member is admin only
    if (profileOrg.isUpperAdmin) {
      const hasRobocall = this.featureQuery.hasDeveloperLicense;
      const hasContactCenter = this.meLicenseQuery.hasContactCenterLicense;
      if (this.hasSMSLicense || hasRobocall || hasContactCenter) {
        menus.push(MENU_ROUTE_MAPS['campaign']);
      }
    }

    this.displayMenus = menus.sort((a, b) => a.order - b.order);

    if (this.displayMenus.length === 0) {
      this.router.navigateByUrl('access-denied');
      return;
    }

    if (!this.route.firstChild && this.displayMenus.length) {
      this.activeLink = this.displayMenus[0];
      if (this.activeLink.urlPath === ROUTE_LINK.users) {
        this.router.navigate([ROUTE_LINK.users, this.lastestUserMenu]);
      } else if (this.activeLink.urlPath === ROUTE_LINK.statistics) {
        this.router.navigate([
          ROUTE_LINK.statistics,
          this.lastestUserMenu !== UserMenu.performance ? this.lastestUserMenu : StatisticMenu.activity_log
        ]);
      } else {
        this.router.navigateByUrl(this.activeLink.urlPath);
      }
    }

    this.loaded = true;
  }

  navigateToUserMenu(userMenu: KeyValue<UserMenu, string>) {
    this.activeLink = MENU_ROUTE_MAPS['users'];
    this.lastestUserMenu = userMenu.key;
    this.updateLastestSubMenu();
    this.router.navigate(['users', this.lastestUserMenu]);
  }

  navigateStatisticMenu(menu: KeyValue<StatisticMenu, string>) {
    this.activeLink = MENU_ROUTE_MAPS['statistics'];
    this.lastestUserMenu = menu.key;
    this.updateLastestSubMenu();
    this.router.navigate(['statistics', this.lastestUserMenu]);
  }

  navigateToLink(menu: RouteMap) {
    if (menu.urlPath === ROUTE_LINK.users) {
      this.usersMenuTrigger.openMenu();
      return;
    }

    if (menu.urlPath === ROUTE_LINK.statistics) {
      this.statisticMenuTrigger.openMenu();
      return;
    }

    if (menu.urlPath === ROUTE_LINK.calls) {
      this.callsMenuTrigger.openMenu();
      return;
    }

    if (menu.urlPath === ROUTE_LINK.chats) {
      this.chatsMenuTrigger.openMenu();
      return;
    }

    this.activeLink = menu;
    this.router.navigate([menu.urlPath]);
  }

  updateLastestSubMenu() {
    if (this.lastestUserMenu === this.personalSettings.users) {
      return;
    }
    this.personalSettings = { ...this.personalSettings, users: this.lastestUserMenu };
    this.personalSettingService.updateAppSettings(this.personalSettings).subscribe();
  }

  navigateToCallMenu(callMenu: KeyValue<CallMenu, string>) {
    this.activeLink = MENU_ROUTE_MAPS['calls'];
    this.selectedCallMenu = callMenu.key;
    this.router.navigate(['calls', callMenu.key]);
  }

  navigateToChatMenu(chatMenu: KeyValue<ChatMenu, string>) {
    this.activeLink = MENU_ROUTE_MAPS['chats'];
    this.selectedChatMenu = chatMenu.key;
    this.router.navigate(['chats', chatMenu.key]);
  }

  private resetMenu() {
    this.userMenus = [];
    this.callsMenus = [];
  }
}
