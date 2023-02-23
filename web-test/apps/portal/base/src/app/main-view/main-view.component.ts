import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ProfileOrg } from '@b3networks/api/auth';
import {
  ApplicationQuery,
  ApplicationService,
  AppRenderType,
  AppStateService,
  PortalApplication,
  RenderStatus,
  SessionQuery
} from '@b3networks/portal/base/shared';
import {
  ActiveApplicationInput,
  DestroySubscriberComponent,
  EventMapName,
  isDistributionOrAdminPortal
} from '@b3networks/shared/common';
import { HashMap, ID } from '@datorama/akita';
import { combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { WindowMessageService } from '../shared/service/window-message.service';

const HOME_PAGE = 'home';

@Component({
  selector: 'b3n-main-view',
  templateUrl: './main-view.component.html',
  styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent extends DestroySubscriberComponent implements OnInit {
  iframeApps$: Observable<PortalApplication[]>;
  webElementApps$: Observable<PortalApplication[]>;
  activeAppId: string;
  currentOrg: ProfileOrg;

  viewNotFound: boolean;
  showLandingPage: boolean;

  domain: string;

  constructor(
    private route: ActivatedRoute,
    private appQuery: ApplicationQuery,
    private appService: ApplicationService,
    private sessionQuery: SessionQuery,
    private appStateService: AppStateService,
    private title: Title,
    private windowService: WindowMessageService
  ) {
    super();
  }

  ngOnInit() {
    this.appQuery
      .selectActiveId()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe((appid: ID) => (this.activeAppId = appid as string));

    combineLatest([
      this.route.params,
      this.route.queryParams.pipe(filter(query => Object.keys(query)?.length > 0)),
      this.sessionQuery.currentOrg$.pipe(filter(x => x != null))
    ])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([params, , org]) => {
        const viewPath = params['view'];
        const view = this.appQuery.getApplicationbyId(org.orgUuid, viewPath);
        if (!!viewPath && !!view && view.isExternalApp && view.renderStatus === RenderStatus.loaded) {
          const queryParams: HashMap<string[]> = {};
          this.route.snapshot.queryParamMap.keys.forEach(key => {
            queryParams[key] = this.route.snapshot.queryParamMap.getAll(key);
          });

          this.appService.setMoreQueryForIframe(view, queryParams);
        }
      });

    combineLatest([
      this.route.params,
      this.sessionQuery.currentOrg$.pipe(
        distinctUntilChanged(),
        tap(org => this.handleOrgChanged(org))
      ),
      this.sessionQuery.isLoggedIn$,
      this.appQuery.selectLoading()
    ])
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(([params, org, isloggedIn, loading]) => params != null && org != null && isloggedIn && !loading)
      )
      .subscribe(([params, org]) => {
        const viewPath = params['view'];
        this.viewNotFound = false;
        this.showLandingPage = false;
        this.currentOrg = org;

        const view = this.appQuery.getApplicationbyId(org.orgUuid, viewPath);

        // Make UW as home page when user assigned teamchat license
        if (viewPath === HOME_PAGE && !view) {
          this.appService.deactivateApplication();
          this.showLandingPage = true;
          return;
        }

        if (view) {
          if (view.renderType === AppRenderType.blank) {
            let origin = this.domain || location.origin;
            origin = origin.endsWith('/') ? origin : origin + '/';
            window.open(origin + +view.rightSourcePath, '_blank');
          } else {
            const queryParams: HashMap<string[]> = {};
            const resetQueryParams = {};
            this.route.snapshot.queryParamMap.keys.forEach(key => {
              queryParams[key] = this.route.snapshot.queryParamMap.getAll(key);
              resetQueryParams[key] = null;
            });

            if (!view.rendered) {
              this.appStateService.toggleAppLoading(true);
            }

            this.appService.activeApplication(org, view, queryParams);
            if (view?.appId) {
              this.windowService.fireEventAllRegisters(
                EventMapName.activeApplication,
                <ActiveApplicationInput>{ appId: view?.appId },
                org.orgUuid
              );
            }

            this.title.setTitle([org.orgShortName, view.name].join(' | '));
          }
        } else {
          this.viewNotFound = true;
        }

        if (environment.env === 'local') {
          this.domain = `https://${org.domain}/` + (isDistributionOrAdminPortal() ? 'admin/' : '');
        } else {
          this.domain = '';
        }
      });

    combineLatest([this.appQuery.selectLoading(), this.appQuery.selectActive().pipe(filter(app => app != null))])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([loading, activeApp]) => {
        if (!(loading || activeApp.renderStatus !== RenderStatus.loaded)) {
          setTimeout(() => {
            this.appStateService.toggleAppLoading(false);
          }, 0);
        }
      });
  }

  iframeLoaded(app: PortalApplication) {
    if (app && app.renderStatus === RenderStatus.loading && app.id === this.activeAppId) {
      setTimeout(() => {
        this.appService.markAppAsRendered(app);
      }, 0);
    }
  }

  trackByApp(i, app: PortalApplication): string {
    return app.id;
  }

  handleOrgChanged(org: ProfileOrg) {
    if (org) {
      this.iframeApps$ = this.appQuery.selectActivatedIframeApps(org.orgUuid);
      this.webElementApps$ = this.appQuery.selectActivatedElementApps(org.orgUuid);
    }
  }
}
