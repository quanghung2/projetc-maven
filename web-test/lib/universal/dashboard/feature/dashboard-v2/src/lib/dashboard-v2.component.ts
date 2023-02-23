import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  IamService,
  IAM_GROUP_UUIDS,
  IdentityProfile,
  IdentityProfileQuery,
  MeIamQuery,
  MeIamService,
  ProfileOrg
} from '@b3networks/api/auth';
import {
  Dashboard2,
  DashboardMap,
  DashboardV2Service,
  DASHBOARD_2_UUID,
  GlobalConfig,
  Starred,
  STORE_CONFIG_TOKEN
} from '@b3networks/api/dashboard';
import { DashboardV2AppSetting, PersonalSettingsQuery, PersonalSettingsService } from '@b3networks/api/portal';
import { SessionService } from '@b3networks/portal/base/shared';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { DASHBOARD_V2_LOGGED_OUT, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { firstValueFrom } from 'rxjs';
import { filter, finalize, takeUntil, tap } from 'rxjs/operators';
import { PublicDeviceComponent } from './dashboard-detail-v2/public-device/public-device.component';
import { ManageAccessComponent } from './manage-access/manage-access.component';
import { StoreDashboardV2Component } from './store-dashboard-v2/store-dashboard-v2.component';
import { StoreDeviceComponent } from './store-device/store-device.component';

@Component({
  selector: 'b3n-dashboard-v2',
  templateUrl: './dashboard-v2.component.html',
  styleUrls: ['./dashboard-v2.component.scss']
})
export class DashboardV2Component extends DestroySubscriberComponent implements OnInit {
  noPermission: boolean;
  activeDashboard: Dashboard2;
  dashboard2Tabs: Dashboard2[] = [];
  dashboard2StarredTabs: Dashboard2[] = [];
  dashboard2UnstarredTabs: Dashboard2[] = [];
  unstarActiveDashboard2Tab: Dashboard2;
  loadingV2: boolean = true;
  maxTab: number;
  starred: Starred;
  resourceIds: string[] = [];
  isTV: boolean;
  OTHER_WIDTH = 450;
  deviceId: string;
  errorMsg: string;
  globalConfig: GlobalConfig;
  starring: boolean;
  currentOrg: ProfileOrg;
  profile: IdentityProfile;
  dashboardMap: DashboardMap;
  grantedManageDashboard: boolean;

  readonly TAB_WIDTH = window.innerWidth >= 3840 && window.innerHeight >= 2160 ? 600 : 200;

  constructor(
    private dashboardV2Service: DashboardV2Service,
    public dialog: MatDialog,
    private toastService: ToastService,
    @Inject(STORE_CONFIG_TOKEN) private storeConfig: HashMap<string>,
    private route: ActivatedRoute,
    private profileQuery: IdentityProfileQuery,
    private sessionService: SessionService,
    private personalSettingsQuery: PersonalSettingsQuery,
    private personalSettingsService: PersonalSettingsService,
    private meIamQuery: MeIamQuery,
    private meIamService: MeIamService,
    private iamService: IamService
  ) {
    super();
  }

  setMaxTab(width: number) {
    this.maxTab = Math.floor((width - this.OTHER_WIDTH) / this.TAB_WIDTH);

    if (this.unstarActiveDashboard2Tab) {
      this.maxTab -= 1;
    }
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.setMaxTab(event.target.innerWidth);
  }

  async ngOnInit() {
    await firstValueFrom(this.meIamService.getAssignedGroup());

    this.grantedManageDashboard = this.meIamQuery.hasGrantedManageDashboard;
    this.profile = await firstValueFrom(this.profileQuery.profile$.pipe(filter(profile => !!profile)));
    this.currentOrg = this.profile.organizations.length ? this.profile.organizations[0] : null;

    if (!this.currentOrg) {
      return;
    }

    const params = this.route.snapshot.queryParams;

    if (params['resourceIds']) {
      this.resourceIds = (params['resourceIds'] as string).split(',');
    }

    if (params['deviceId']) {
      this.deviceId = params['deviceId'];
    }

    if (this.resourceIds.length) {
      this.OTHER_WIDTH = 200;
      this.isTV = true;
      this.dashboardV2Service.isTV$.next(true);
    }

    this.initData(true);

    this.dashboardV2Service.dashboard2TabsChanged$
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(uuid => {
          if (uuid) {
            this.initData(false, uuid);
          } else {
            this.initData(true);
          }
        })
      )
      .subscribe();
  }

  storeDashboardV2() {
    this.dashboardV2Service.isPopupOpening$.next(true);
    this.dialog
      .open(StoreDashboardV2Component, {
        ...this.storeConfig,
        data: {},
        disableClose: true
      })
      .afterClosed()
      .pipe(
        finalize(() => this.dashboardV2Service.isPopupOpening$.next(false)),
        filter(uuid => !!uuid),
        tap(async uuid => {
          this.initData(false, uuid);
        })
      )
      .subscribe();
  }

  async initData(onInit: boolean, uuid: string = null) {
    this.setMaxTab((window?.parent || window)?.innerWidth);
    this.loadingV2 = true;

    try {
      let dashboard2Tabs: Dashboard2[] = [];

      if (this.resourceIds.length) {
        dashboard2Tabs = await firstValueFrom(
          this.dashboardV2Service.getPublicDashboards(this.resourceIds.join(','), this.deviceId)
        );
      } else {
        if (this.currentOrg.isOwner) {
          dashboard2Tabs = await this.dashboardV2Service.getDashboards().toPromise();
        } else if (this.currentOrg.isAdmin) {
          if (!this.grantedManageDashboard) {
            this.setErrorMsg("No dashboard available, please contact your organization's admin");
            return;
          }

          dashboard2Tabs = await this.dashboardV2Service.getDashboards().toPromise();
        } else {
          const iamMember = await firstValueFrom(
            this.iamService.getMemberWithIAM(X.orgUuid, this.profile.uuid, IAM_GROUP_UUIDS.dashboard)
          );
          const dashboardMap = this.dashboardV2Service.getDashboardMap(iamMember);

          if (dashboardMap === null) {
            this.setErrorMsg("No dashboard available, please contact your organization's admin");
            return;
          }

          if (dashboardMap === '*') {
            dashboard2Tabs = await this.dashboardV2Service.getDashboards().toPromise();
          } else {
            const uuids = Object.keys(dashboardMap);

            if (!uuids.length) {
              this.setErrorMsg("No dashboard available, please contact your organization's admin");
              return;
            }

            this.dashboardMap = dashboardMap;
            dashboard2Tabs = await firstValueFrom(this.dashboardV2Service.getDashboardsByUuids(uuids));

            if (!dashboard2Tabs.length) {
              this.setErrorMsg("No dashboard available, please contact your organization's admin");
              return;
            }
          }
        }
      }

      this.globalConfig = await firstValueFrom(this.dashboardV2Service.getGlobalConfig());
      this.unstarActiveDashboard2Tab = null;
      this.dashboard2StarredTabs = [];
      this.dashboard2UnstarredTabs = [];
      this.starred = this.renderStarred(dashboard2Tabs);

      if (this.resourceIds.length) {
        this.starred.starredUuids = this.resourceIds;
      }

      this.dashboardV2Service.starredUuids$.next(this.starred.starredUuids);

      for (let i = 0; i < dashboard2Tabs.length; i++) {
        const dashboard = dashboard2Tabs[i];
        const index = this.starred.starredUuids.findIndex(s => s === dashboard.uuid);

        if (index > -1) {
          dashboard.starred = true;
          dashboard.starIndex = index;
        }
      }

      dashboard2Tabs.forEach(dashboard => {
        if (dashboard.starred) {
          this.dashboard2StarredTabs.push(dashboard);
        } else {
          this.dashboard2UnstarredTabs.push(dashboard);
        }
      });

      this.dashboard2StarredTabs.sort((a, b) => a.starIndex - b.starIndex);
      this.dashboard2Tabs = [...this.dashboard2StarredTabs, ...this.dashboard2UnstarredTabs];

      if (this.dashboard2Tabs.length) {
        let dashboard: Dashboard2;

        if (onInit) {
          dashboard = this.dashboard2StarredTabs.length ? this.dashboard2StarredTabs[0] : this.dashboard2Tabs[0];
        } else {
          const d = this.dashboard2Tabs.find(d => d.uuid === uuid);
          dashboard = d ?? this.dashboard2Tabs[this.dashboard2Tabs.length - 1];

          if (dashboard) {
            this.active(dashboard.uuid);
          }
        }

        this.activeDashboard = dashboard;
      }
    } catch (e) {
      this.setErrorMsg(e['message'] ?? DEFAULT_WARNING_MESSAGE);
    } finally {
      this.loadingV2 = false;
    }
  }

  setErrorMsg(msg: string) {
    this.activeDashboard = null;
    this.errorMsg = msg;
  }

  renderStarred(dashboard2Tabs: Dashboard2[]) {
    const dashboardV2AppSetting = this.personalSettingsQuery.getAppSettings(
      X.orgUuid,
      DASHBOARD_2_UUID
    ) as DashboardV2AppSetting;

    let starredUuids: string[] = [];
    const uuids = dashboard2Tabs
      .sort((a, b) => (a.isDefault === b.isDefault ? 0 : a.isDefault ? 1 : -1))
      .map(d => d.uuid);

    if (dashboardV2AppSetting?.starredUuids?.length >= this.globalConfig.minStarred) {
      starredUuids = dashboardV2AppSetting.starredUuids.filter(uuid => uuids.includes(uuid));

      if (!starredUuids.length) {
        starredUuids = uuids.slice(0, this.globalConfig.maxStarred);
      }
    } else {
      if (!dashboardV2AppSetting?.starredUuids?.length) {
        starredUuids = uuids.slice(0, this.globalConfig.maxStarred);
      } else {
        starredUuids = [
          ...starredUuids,
          ...uuids
            .filter(uuid => !starredUuids.includes(uuid))
            .slice(0, this.globalConfig.maxStarred - starredUuids.length - 1)
        ];
      }
    }

    if (!this.dashboardV2Service.isTV$.getValue()) {
      this.personalSettingsService
        .updateAppSettings({
          ...dashboardV2AppSetting,
          starredUuids
        })
        .subscribe();
    }

    return { starredUuids } as Starred;
  }

  async star(e: MouseEvent, dashboard: Dashboard2) {
    e.stopPropagation();
    let successCallback: () => void;
    let failCallback: () => void;

    if (this.starred.starredUuids.includes(dashboard.uuid)) {
      this.starred.starredUuids = this.starred.starredUuids.filter(s => s !== dashboard.uuid);

      successCallback = () => {
        this.dashboard2StarredTabs = this.dashboard2StarredTabs.filter(d => d.uuid !== dashboard.uuid);
        this.dashboard2UnstarredTabs.push(dashboard);

        if (this.activeDashboard?.uuid === dashboard.uuid) {
          this.unstarActiveDashboard2Tab = dashboard;
          this.setMaxTab((window?.parent || window)?.innerWidth);
        }
      };

      failCallback = () => {
        this.starred.starredUuids.push(dashboard.uuid);
      };
    } else {
      this.starred.starredUuids.push(dashboard.uuid);

      successCallback = () => {
        this.dashboard2StarredTabs.push(dashboard);
        this.dashboard2UnstarredTabs = this.dashboard2UnstarredTabs.filter(d => d.uuid !== dashboard.uuid);

        if (this.unstarActiveDashboard2Tab?.uuid === dashboard.uuid) {
          this.unstarActiveDashboard2Tab = null;
          this.setMaxTab((window?.parent || window)?.innerWidth);
        }
      };

      failCallback = () => {
        this.starred.starredUuids = this.starred.starredUuids.filter(s => s !== dashboard.uuid);
      };
    }

    try {
      if (this.starred.starredUuids.length > this.globalConfig.maxStarred) {
        throw {
          message: `Max ${this.globalConfig.maxStarred} dashboards can be starred`
        };
      }

      if (this.starred.starredUuids.length < this.globalConfig.minStarred) {
        throw {
          message: `At least ${this.globalConfig.minStarred} dashboard need to be starred`
        };
      }

      this.starring = true;

      const dashboardV2AppSetting = this.personalSettingsQuery.getAppSettings(
        X.orgUuid,
        DASHBOARD_2_UUID
      ) as DashboardV2AppSetting;

      await firstValueFrom(
        this.personalSettingsService.updateAppSettings({
          ...dashboardV2AppSetting,
          starredUuids: this.starred.starredUuids
        })
      );

      successCallback();
      dashboard.starred = !dashboard.starred;
    } catch (e) {
      failCallback();
      this.toastService.warning(e['message']);
    } finally {
      this.starring = false;
    }
  }

  active(uuid: string) {
    if (this.activeDashboard.uuid === uuid) {
      return;
    }

    const dashboard = this.dashboard2Tabs.find(d => d.uuid === uuid);
    this.activeDashboard = dashboard;
    this.unstarActiveDashboard2Tab = dashboard.starred ? null : dashboard;
    this.setMaxTab((window?.parent || window)?.innerWidth);
  }

  openPublicDeviceDialog() {
    this.dashboardV2Service.isPopupOpening$.next(true);
    this.dialog
      .open(PublicDeviceComponent, {
        width: '750px',
        height: '600px',
        panelClass: 'public-device__dashboard2',
        disableClose: true
      })
      .afterClosed()
      .pipe(tap(() => this.dashboardV2Service.isPopupOpening$.next(false)))
      .subscribe();
  }

  storeDevice(title: string, manageMember: boolean) {
    this.dashboardV2Service.isPopupOpening$.next(true);
    this.dialog
      .open(StoreDeviceComponent, {
        width: '750px',
        height: '600px',
        panelClass: 'store-device__dashboard2',
        data: {
          title,
          isOwner: !!this.currentOrg?.isOwner,
          manageMember
        },
        disableClose: true
      })
      .afterClosed()
      .pipe(finalize(() => this.dashboardV2Service.isPopupOpening$.next(false)))
      .subscribe();
  }

  manageAccess() {
    this.dashboardV2Service.isPopupOpening$.next(true);
    this.dialog
      .open(ManageAccessComponent, {
        width: '750px',
        height: '600px',
        panelClass: 'manage-access__dashboard2',
        data: {},
        disableClose: true
      })
      .afterClosed()
      .pipe(finalize(() => this.dashboardV2Service.isPopupOpening$.next(false)))
      .subscribe();
  }

  logout() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '350px',
        data: <ConfirmDialogInput>{
          title: `Confirm`,
          message: `Are you sure you want to logout?`,
          confirmLabel: 'Yes',
          cancelLabel: 'No',
          color: 'warn'
        },
        panelClass: 'dashboard-v2__confirm'
      })
      .afterClosed()
      .subscribe(async res => {
        if (res) {
          this.sessionService.logout(false).subscribe(_ => {
            this.toastService.success(`Logout successfully`);
            window.top.postMessage(DASHBOARD_V2_LOGGED_OUT, '*');
          });
        }
      });
  }
}
