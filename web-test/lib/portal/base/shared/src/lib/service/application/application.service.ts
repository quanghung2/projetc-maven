import { DOCUMENT } from '@angular/common';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { FetchPortalAppResp } from '@b3networks/api/app';
import {
  IAM_DEVHUB_ACTIONS,
  IAM_SERVICES,
  IAM_UI_ACTIONS,
  IAM_UI_RESOURCES,
  MeIamQuery,
  OrganizationPolicyQuery,
  ProfileOrg
} from '@b3networks/api/auth';
import { PersonalWhitelistQuery } from '@b3networks/api/dnc';
import { ReleaseVersion } from '@b3networks/api/gatekeeper';
import { FeatureQuery, MeQuery } from '@b3networks/api/license';
import { AdminApplication, PartnerService, PortalConfigQuery } from '@b3networks/api/partner';
import { Pinnedapp } from '@b3networks/api/portal';
import { Product, ProductType } from '@b3networks/api/store';
import { APP_IDS, B3_ORG_UUID, isDistributionDomain, X_B3_HEADER } from '@b3networks/shared/common';
import { HashMap } from '@datorama/akita';
import { forkJoin, Observable, Observer, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap, tap } from 'rxjs/operators';
import { AppRenderType, PortalApplication, PortalAppType, RenderStatus } from './application.model';
import { ApplicationQuery } from './application.query';
import { ApplicationStore, _sortMenuFunc } from './application.store';

const LICENSE_ORGS_NEED_REPORT_APP = [
  '061c592b-44e4-475e-8b7a-1e5db18bcabe',
  'b33fe971-ce40-4b82-a5c9-5a908515cde9',
  'f17b4dd0-1d78-49c7-8e31-ca4b0ad1f9b9'
];

const WEB_ELEMENT_RENDER_APPS = []; // for now, we dont support web element yet ['drX4Id5eTSKpJUzC'];
const BLANK_RENDER_APPS = [];

// const ORGs_HAS_SUPPORT_CENTER = [B3_ORG_UUID, HOIIO_INTERNAL_TESTING_ORG_UUID]; // b3 & hoiio internal testing

const ELEMENT_MAPPING = {
  drX4Id5eTSKpJUzC: 'b3n-uni-dashboard'
};

const FEATURE_APP_IDS = [
  // for all model
  APP_IDS.DASHBOARD,
  APP_IDS.CUSTOMER_REPORT,

  // app model && b3 org
  APP_IDS.FLOW,

  // license apps only
  APP_IDS.APPLICATIONS_SETTING,
  APP_IDS.COMMUNICATION_HUB,
  APP_IDS.DEVELOPER_HUB,
  APP_IDS.UNIFIED_WORKSPACE,
  APP_IDS.PHONE_SYSTEM,
  APP_IDS.AUTO_ATTENDANT,
  APP_IDS.SIPTRUNK,
  APP_IDS.BYOC_TRUNK,
  APP_IDS.BUSINESS_HUB,
  APP_IDS.CONTACT,
  APP_IDS.FILE_EXPLORER
];

const PORTAL_MODULE_APP_IDS = [APP_IDS.STORE];

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  constructor(
    private store: ApplicationStore,
    private query: ApplicationQuery,
    private partnerService: PartnerService,
    private http: HttpClient,
    @Inject(DOCUMENT) private document: any,
    private assignedFeatureQuery: MeQuery,
    private orgFeatureQuery: FeatureQuery,
    private assignedPermissionQuery: MeIamQuery,
    private portalConfigQuery: PortalConfigQuery,
    private orgPolicyQuery: OrganizationPolicyQuery,
    private personalWhitelistQuery: PersonalWhitelistQuery
  ) {
    // todo nothing
  }

  // this method call after feature, and iam API
  initModulesAndApps(org: ProfileOrg) {
    this.store.setLoading(true);

    const adminAppStream: Observable<Array<AdminApplication>> = org.isPartner
      ? this.partnerService.getAdminAppVisible()
      : of([]);

    return forkJoin([
      this.fetchAllPortalApp(org),
      adminAppStream,
      this.getVisibilityProduct(org.orgUuid),
      this.getPinnedApps().pipe(catchError(_ => of([])))
    ]).pipe(
      map(([applications, adminApps, products, pinnedApps]) => {
        let visibilityApplications = new Array<PortalApplication>();

        if (org.isPartner) {
          const pathPrefix = this.getPathPrefix(org);
          adminApps.map(product => {
            const installedApp = applications.find(app => app.appId === product.appId);
            if (installedApp) {
              if (WEB_ELEMENT_RENDER_APPS.indexOf(installedApp.appId) > -1) {
                installedApp.withWebComponent(ELEMENT_MAPPING[installedApp.appId]);
              } else if (BLANK_RENDER_APPS.indexOf(installedApp.appId) > -1) {
                installedApp.renderType = AppRenderType.blank;
              } else {
                installedApp.renderType = AppRenderType.iframe;
              }
              installedApp.installationStatus = 'installed';
              installedApp.pathPrefix = pathPrefix;
              if (installedApp.appId === APP_IDS.FLOW) {
                installedApp.order = 4;
              }

              visibilityApplications.push(installedApp);
            }
          });
        }

        if (org.licenseEnabled) {
          // hardcoding product list for license orgs
          products = [
            //  https://b3networks.atlassian.net/wiki/spaces/EKB/pages/1949958145/Unified+User+Interface
            new Product({
              productId: APP_IDS.COMMUNICATION_HUB,
              type: ProductType.app,
              order: 3
            }),
            new Product({
              productId: APP_IDS.DASHBOARD,
              type: ProductType.app,
              order: 7
            })
          ];

          if (this.assignedFeatureQuery.hasPhoneSystemLicense) {
            products.push(
              new Product({
                productId: APP_IDS.UNIFIED_WORKSPACE,
                name: 'home',
                type: ProductType.app,
                order: 0
              })
            );
          }

          if (
            this.assignedPermissionQuery.hasGrantedManageContact ||
            this.personalWhitelistQuery.hasGrantedPersonalWhitelist
          ) {
            products.push(
              new Product({
                productId: APP_IDS.CONTACT,
                type: ProductType.app,
                order: 1
              })
            );
          }

          if (
            (this.assignedFeatureQuery.hasPhoneSystemLicense ||
              (this.orgFeatureQuery.hasPhoneSystemBaseLicense &&
                this.assignedPermissionQuery.hasGrantedManagePhoneSystem)) &&
            this.orgPolicyQuery.hasGrantedResource(
              org.orgUuid,
              IAM_SERVICES.ui,
              IAM_UI_ACTIONS.display_sidebar_feature,
              IAM_UI_RESOURCES.phoneSystem
            ) // migrating step
          ) {
            products.push(
              new Product({
                productId: APP_IDS.PHONE_SYSTEM,
                type: ProductType.app,
                order: 2
              })
            );
          }
          if (
            this.orgFeatureQuery.hasAutoAttendantLicense &&
            this.assignedPermissionQuery.hasGrantedManageAttendant &&
            this.orgPolicyQuery.hasGrantedResource(
              org.orgUuid,
              IAM_SERVICES.ui,
              IAM_UI_ACTIONS.display_sidebar_feature,
              IAM_UI_RESOURCES.autoAttendant
            ) // migrating step
          ) {
            products.push(
              new Product({
                productId: APP_IDS.AUTO_ATTENDANT,
                type: ProductType.app,
                order: 5
              })
            );
          }

          // admin or member has granted access permission
          if (
            this.orgFeatureQuery.hasDeveloperLicense &&
            (this.assignedPermissionQuery.hasGrantedManageDevHub ||
              this.assignedPermissionQuery.hasGrantedAction(IAM_SERVICES.devhub, IAM_DEVHUB_ACTIONS.access))
          ) {
            products.push(
              new Product({
                productId: APP_IDS.DEVELOPER_HUB,
                type: ProductType.app,
                order: 4
              })
            );
          }

          if (this.orgFeatureQuery.hasSIPLicense && this.assignedPermissionQuery.hasGrantedManageSIP) {
            products.push(
              new Product({
                productId: APP_IDS.SIPTRUNK,
                type: ProductType.app,
                order: 6
              })
            );
          }
          if (this.orgFeatureQuery.hasBYOCTrunkLicense && this.assignedPermissionQuery.hasGrantedManageSIP) {
            products.push(
              new Product({
                productId: APP_IDS.BYOC_TRUNK,
                type: ProductType.app,
                order: 7
              })
            );
          }

          if (LICENSE_ORGS_NEED_REPORT_APP.includes(org.orgUuid)) {
            products.push(
              new Product({
                productId: APP_IDS.CUSTOMER_REPORT,
                type: PortalAppType.application,
                order: 8,
                name: 'Reports'
              })
            );
          }

          if (org.isPartner && this.assignedPermissionQuery.hasGrantedManageBizHub) {
            products.push(
              new Product({
                productId: APP_IDS.BUSINESS_HUB,
                type: ProductType.app
              })
            );
          }

          if (
            this.assignedPermissionQuery.hasGrantedManageFileExplorer &&
            this.orgPolicyQuery.hasGrantedResource(
              org.orgUuid,
              IAM_SERVICES.ui,
              IAM_UI_ACTIONS.display_sidebar_feature,
              IAM_UI_RESOURCES.fileExplorer
            ) // migrating step
          ) {
            products.push(
              new Product({
                productId: APP_IDS.FILE_EXPLORER,
                type: ProductType.app
              })
            );
          }
        }

        // show flow for none license org
        if (!org.licenseEnabled && !products.some(pu => pu.productId === APP_IDS.FLOW)) {
          products.push(
            new Product({
              productId: APP_IDS.FLOW,
              type: ProductType.app
            })
          );
        }

        if (org.orgUuid === B3_ORG_UUID && !products.some(pu => pu.productId === APP_IDS.LEAVE)) {
          products.push(
            new Product({
              productId: APP_IDS.LEAVE,
              type: ProductType.app
            })
          );
        }

        // add store app
        if (this.portalConfigQuery.getValue()?.showStore && !products.some(pu => pu.productId === APP_IDS.STORE)) {
          products.push(
            new Product({
              productId: APP_IDS.STORE,
              type: ProductType.app
            })
          );
        }

        products.map(product => {
          const installedApp = applications.find(app => app.appId === product.productId);
          if (installedApp && visibilityApplications.findIndex(a => a.id === installedApp.id) === -1) {
            if (WEB_ELEMENT_RENDER_APPS.indexOf(installedApp.appId) > -1) {
              installedApp.withWebComponent(ELEMENT_MAPPING[installedApp.appId]);
            } else if (BLANK_RENDER_APPS.indexOf(installedApp.appId) > -1) {
              installedApp.renderType = AppRenderType.blank;
            } else {
              installedApp.renderType = AppRenderType.iframe;
            }

            // replace app with product name for branding
            installedApp.name = product.name || installedApp.name;
            installedApp.updateId(); // to map path again
            installedApp.iconUrl = product.logo || installedApp.iconUrl;
            installedApp.order = product.order;
            // always show above products for license org
            installedApp.installationStatus = org.licenseEnabled ? 'installed' : installedApp.installationStatus;

            visibilityApplications.push(installedApp);
          }
        });

        // support external app
        applications
          .filter(a => a.isExternalApp)
          .forEach(a => {
            if (visibilityApplications.findIndex(va => va.id === a.id) === -1) {
              a.renderType = AppRenderType.iframe;
              a.updateId();
              visibilityApplications.push(a);
            }
          });

        visibilityApplications = visibilityApplications.map(v => {
          const pinned = pinnedApps.find(a => a.appId === v.appId);
          if (pinned) {
            v.withPinned(pinned);
          }
          if (FEATURE_APP_IDS.includes(v.appId)) {
            v.isFeatureApp = true;
          }

          if (PORTAL_MODULE_APP_IDS.includes(v.appId)) {
            v.type = PortalAppType.module;
          }
          return v;
        });

        visibilityApplications.sort(_sortMenuFunc);

        return visibilityApplications;
      }),
      mergeMap(applications => {
        let updatePinnedAppSubscription = of(<Pinnedapp[]>[]);
        const installedApps = applications.filter(a => a.isInstalled);
        if (installedApps.length > 0 && installedApps.filter(a => a.pinned).length === 0) {
          const pinnedApps = installedApps
            .slice(0, installedApps.length < 10 ? installedApps.length : 10)
            .map(a => <Pinnedapp>{ appId: a.appId, order: a.pinnedOrder });

          updatePinnedAppSubscription = this.updatePinnedApps(pinnedApps);
        }
        return forkJoin([of(applications), updatePinnedAppSubscription]);
      }),
      tap(([applications, pinnedApps]) => {
        if (pinnedApps.length > 0) {
          applications = applications.map(v => {
            const pinned = pinnedApps.find(a => a.appId === v.appId);
            if (pinned) {
              v.withPinned(pinned);
            }
            return v;
          });
        }
        applications = applications.concat(this.getPortalModules(org));

        applications.forEach(a => {
          const newAppIcon = APP_ICONS.find(i => i.app_id === a.appId);
          if (newAppIcon) {
            a.monoIcon = newAppIcon.icon_url || newAppIcon.icon;
            a.monoType = newAppIcon.icon ? 'font' : 'svg';
          }
        });

        applications.sort(_sortMenuFunc);

        if (this.store.getValue().ids.length) {
          this.store.add(applications);
        } else {
          this.store.set(applications);
        }

        this.store.update(state => {
          return { loadedOrgs: [...state.loadedOrgs, org.orgUuid], loading: false };
        });
      })
    );
  }

  setMoreQueryForIframe(view: PortalApplication, queryParams?: HashMap<string[]>) {
    const updatingData = {
      ...view,
      queryParams: { ...view.queryParams, ...queryParams }
    };
    if (queryParams) {
      updatingData.queryParams = { ...view.queryParams, ...queryParams };
    }
    this.store.update(view.id, updatingData);
  }

  activeApplication(org: ProfileOrg, view: PortalApplication, queryParams?: HashMap<string[]>) {
    if (view.renderStatus === RenderStatus.unloaded) {
      this.store.updateRendering(true);
      of(view.appId)
        .pipe(switchMap(appId => (appId ? this.getReleaseVersion(appId) : of(new ReleaseVersion({ version: '*' })))))
        .subscribe(version => {
          const updatingData = {
            ...view,
            version: version.version
          };
          if (queryParams) {
            updatingData.queryParams = { ...view.queryParams, ...queryParams };
          }

          this.performActivatingApp(view, updatingData);
        });
    } else {
      //loading or already loaded, can pull to get right status when it's compleeted
      this.store.setActive(view.id);
    }

    this.store.update(state => {
      const c = Object.assign({}, state.lastActiveApps);
      c[org.orgUuid] = view.portalFragment;
      return { lastActiveApps: c };
    });
  }

  deactivateApplication() {
    if (this.query.getActiveId() != null) {
      this.store.removeActive(this.query.getActiveId());
    }
  }

  private async performActivatingApp(currentApp: PortalApplication, updatingData: Partial<PortalApplication>) {
    if (currentApp.renderType === AppRenderType.webComponent) {
      // need to load script
      await this.loadScript(currentApp)
        .toPromise()
        .then(_ => {
          updatingData.renderStatus = RenderStatus.loaded;
        })
        .catch(error => console.error(error));
    } else {
      updatingData.renderStatus = RenderStatus.loading;
      updatingData.renderedAt = new Date(); // update rendered date
    }

    if (!currentApp.isInstalled && currentApp.type === PortalAppType.application) {
      await this.installApp(currentApp)
        .toPromise()
        .then(_ => {
          updatingData.installationStatus = 'installed';
        })
        .catch(error => console.error(error));
    }

    this.store.update(currentApp.id, updatingData);
    this.store.setActive(currentApp.id);
  }

  markAppAsRendered(app: PortalApplication) {
    if (app.renderType === AppRenderType.iframe) {
      // setTimeout(() => {
      //   try {
      // var iframeWindow: Window;
      //     var iframeElement: HTMLIFrameElement = <HTMLIFrameElement>document.getElementById(app.id);
      //     if (iframeElement) {
      //       iframeWindow = iframeElement.contentWindow;
      //     }
      //   } catch (error) {
      //     // referrence to blocked iframe can break app
      //     iframeWindow = null;
      //   }
      // }, 0);
    }

    this.store.update(app.id, {
      renderStatus: RenderStatus.loaded
      // iframeWindow: iframeWindow
    });
  }

  togglePinnedApp(app: PortalApplication) {
    let pinnedApps = this.query
      .getPinnedApps(app.orgUuid)
      .map(a => <Pinnedapp>{ appId: a.appId, order: a.pinnedOrder });

    if (app.pinned) {
      pinnedApps = pinnedApps.filter(a => a.appId !== app.appId);
    } else {
      pinnedApps.push(<Pinnedapp>{ appId: app.appId, order: pinnedApps.length });
    }
    return this.updatePinnedApps(pinnedApps).pipe(
      tap(_ => {
        if (!app.pinned) {
          this.store.update(app.id, { pinned: true, pinnedOrder: pinnedApps.length - 1 });
        } else {
          this.store.update(app.id, { pinned: false, pinnedOrder: -1 });
        }
      })
    );
  }

  closeApp(app: PortalApplication) {
    this.store.update(app.id, { renderStatus: RenderStatus.unloaded });
    const iframe = this.document.getElementById(app.id);
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
  }

  closeApps(apps: PortalApplication[]) {
    const appIds = [];
    apps.forEach(app => {
      appIds.push(app.id);
      const iframe = this.document.getElementById(app.id);
      if (iframe && iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    });
    this.store.update(appIds, { renderStatus: RenderStatus.unloaded });
  }

  closeAllAppsByOrg(orgUuid: string) {
    const appIds = [];
    const apps = this.query.getOpenedApps(orgUuid);
    console.log(apps);

    for (const app of apps) {
      appIds.push(app.id);
      const iframe = this.document.getElementById(app.id);
      if (iframe && iframe.parentNode) {
        console.log(`removing app ${iframe.id}`);
        iframe.parentNode.removeChild(iframe);
      }
    }

    this.store.update(appIds, { renderStatus: RenderStatus.unloaded });
  }

  updateNotificationCount(id: string, notification: number) {
    this.store.update(id, {
      notificationCount: notification
    });
  }

  updateApplication(id: string, data: Partial<PortalApplication>) {
    this.store.update(id, data);
  }

  /**
   * Cleanup store
   */
  cleanup(): void {
    if (this.store.resettable) {
      this.store.reset();
    }
  }

  addApp(app) {
    this.store.add(app);
  }

  fetchAllPortalApp(org: ProfileOrg): Observable<PortalApplication[]> {
    let headers = new HttpHeaders();
    if (org) {
      headers = headers.set(X_B3_HEADER.orgUuid, org.orgUuid);
    }
    return this.http
      .get<FetchPortalAppResp>(`apps/private/v1/application/getListAppOnPortal`, { headers: headers })
      .pipe(
        map(resp => {
          return resp.list.map(app => {
            const result = PortalApplication.createApplication(app).withOrg(org.orgUuid);
            if (
              [APP_IDS.DASHBOARD, APP_IDS.FLOW].includes(result.appId) ||
              (org.orgUuid === B3_ORG_UUID && [APP_IDS.LEAVE].includes(result.appId))
            ) {
              result.installationStatus = 'installed';
            }

            return result;
          });
        })
      );
  }

  private getVisibilityProduct(orgUuid?: string): Observable<Product[]> {
    let headers = new HttpHeaders();
    if (orgUuid) {
      headers = headers.append(X_B3_HEADER.orgUuid, orgUuid);
    }
    const params = new HttpParams().set('type', 'APP').set('includeDescription', 'true');

    return this.http
      .get<Product[]>(`/store/private/v1/products`, {
        params: params,
        headers: headers
      })
      .pipe(map(list => list.map(product => new Product(product))));
  }

  getReleaseVersion(appId: string) {
    return this.http
      .get<ReleaseVersion>(`gatekeeper/ui/private/v1/release/version/${appId}`)
      .pipe(map(version => new ReleaseVersion(version)));
  }

  private getPinnedApps() {
    return this.http.get<Pinnedapp[]>(`portal/private/v1/settings/pinnedapps`);
  }

  private updatePinnedApps(pinnedapp: Array<Pinnedapp>): Observable<Pinnedapp[]> {
    return this.http.put<void>(`portal/private/v1/settings/pinnedapps`, pinnedapp).pipe(map(_ => pinnedapp));
  }

  private installApp(app: PortalApplication): Observable<void> {
    return this.http.put<void>(`/apps/private/v1/application/${app.appId}/install`, {});
  }

  private loadScript(app: PortalApplication): Observable<PortalApplication> {
    return new Observable<PortalApplication>((observer: Observer<PortalApplication>) => {
      if (app.renderStatus === RenderStatus.loaded) {
        observer.next(app);
        observer.complete();
      } else {
        //load script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = '/' + app.rightSourcePath + 'main.js'; // TODO replace domain
        if (script['readyState']) {
          //IE
          script['onreadystatechange'] = () => {
            if (script['readyState'] === 'loaded' || script['readyState'] === 'complete') {
              script['onreadystatechange'] = null;
              observer.next(app);
              observer.complete();
            }
          };
        } else {
          //Others
          script.onload = () => {
            observer.next(app);
            observer.complete();
          };
        }
        script.onerror = (error: any) => {
          observer.error("Couldn't load script " + script.src);
        };

        document.getElementsByTagName('body')[0].appendChild(script);
      }
    });
  }

  private getPortalModules(org: ProfileOrg) {
    const modules = new Array<PortalApplication>(
      PortalApplication.createPortalModule('Reports', 'reports', 'reports', APP_IDS.CUSTOMER_REPORT).withOrg(
        org.orgUuid
      ),
      PortalApplication.createPortalModule(
        'Support Center',
        'SupportCenter',
        'support-center',
        APP_IDS.SUPPORT_CENTER
      ).withOrg(org.orgUuid),
      PortalApplication.createPortalModule('Releases', 'Releases', 'release-note', APP_IDS.RELEASE_NOTE).withOrg(
        org.orgUuid
      )
    );

    // Only load manage org for app model or admin role of license model.
    if (!org.licenseEnabled || org.isUpperAdmin) {
      modules.push(
        PortalApplication.createPortalModule(
          'Manage Organization',
          'manage-organization',
          'org-managements',
          APP_IDS.ORG_MANAGEMENTS
        ).withOrg(org.orgUuid)
      );
    }

    if (org.licenseEnabled) {
      if (
        ((this.assignedFeatureQuery.hasPhoneSystemLicense ||
          (this.orgFeatureQuery.hasPhoneSystemBaseLicense &&
            this.assignedPermissionQuery.hasGrantedManagePhoneSystem)) &&
          !this.orgPolicyQuery.hasGrantedResource(
            org.orgUuid,
            IAM_SERVICES.ui,
            IAM_UI_ACTIONS.display_sidebar_feature,
            IAM_UI_RESOURCES.phoneSystem
          )) ||
        (this.orgFeatureQuery.hasAutoAttendantLicense &&
          this.assignedPermissionQuery.hasGrantedManageAttendant &&
          !this.orgPolicyQuery.hasGrantedResource(
            org.orgUuid,
            IAM_SERVICES.ui,
            IAM_UI_ACTIONS.display_sidebar_feature,
            IAM_UI_RESOURCES.autoAttendant
          )) // migrating step
      ) {
        const appSetting = PortalApplication.createPortalModule(
          'Settings',
          'Settings',
          APP_IDS.APPLICATIONS_SETTING,
          APP_IDS.APPLICATIONS_SETTING
        ).withOrg(org.orgUuid);
        appSetting.order = 999;
        appSetting.isFeatureApp = FEATURE_APP_IDS.includes(appSetting.appId);
        modules.push(appSetting);
      }

      modules.push(
        PortalApplication.createPortalModule('SSO Identity Provider', 'sso', 'ssoidp', APP_IDS.SSO_IDP).withOrg(
          org.orgUuid
        )
      );
    }

    return modules;
  }

  private getPathPrefix(org: ProfileOrg) {
    return org.isPartner && !isDistributionDomain() ? 'admin/' : null;
  }
}

const APP_ICONS = [
  {
    app_id: APP_IDS.UNIFIED_WORKSPACE,
    icon: 'home'
  },
  {
    app_id: APP_IDS.DASHBOARD,
    icon: 'dashboard'
  },
  {
    app_id: APP_IDS.FLOW,
    icon_url: 'flow'
  },
  {
    app_id: APP_IDS.COMMUNICATION_HUB,
    icon_url: 'spoke'
  },
  {
    app_id: APP_IDS.APPLICATIONS_SETTING,
    icon: 'settings'
  },
  {
    app_id: APP_IDS.DEVELOPER_HUB,
    icon: 'code'
  },
  {
    app_id: APP_IDS.SIPTRUNK,
    icon: 'sip'
  },
  {
    app_id: APP_IDS.BYOC_TRUNK,
    icon: 'settings_input_antenna'
  },
  {
    app_id: APP_IDS.AUTO_ATTENDANT,
    icon: 'swap_horiz'
  },
  {
    app_id: APP_IDS.PHONE_SYSTEM,
    icon: 'settings_phone'
  },
  {
    app_id: APP_IDS.CUSTOMER_REPORT,
    icon: 'description'
  },
  {
    app_id: APP_IDS.BUSINESS_HUB,
    icon: 'store'
  },
  {
    app_id: APP_IDS.CONTACT,
    icon: 'contacts'
  },
  {
    app_id: APP_IDS.FILE_EXPLORER,
    icon: 'storage'
  }
];
