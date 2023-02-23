import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer, Title } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ProfileOrg, SecurityComplianceQuery, SecurityService, TfaInfoQuery, TfaService } from '@b3networks/api/auth';
import { PartnerService, PortalConfigQuery, PortalConfigService } from '@b3networks/api/partner';
import { PersonalSettingsQuery, PersonalSettingsService } from '@b3networks/api/portal';
import { ChatService, SocketStatus, TimeService, WindownActiveService } from '@b3networks/api/workspace';
import {
  ApplicationQuery,
  ApplicationService,
  AppStateQuery,
  AppStateService,
  SessionQuery,
  SessionService
} from '@b3networks/portal/base/shared';
import { buildUrlParameter, EventMapName, PORTAL_BASE_HANDLE_WS, UUID_V4_REGEX, X } from '@b3networks/shared/common';
import { BrowserNotificationService } from '@b3networks/shared/notification';
import { HashMap } from '@datorama/akita';
import { differenceInSeconds } from 'date-fns';
import { combineLatest, forkJoin, Observable, Subject, Subscription, timer } from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  filter,
  finalize,
  map,
  take,
  takeUntil,
  tap
} from 'rxjs/operators';
import { MainViewComponent } from './main-view/main-view.component';
import { SwitchOrganizationData, SwitchOrganizationDialog } from './shared/modal/switch-org/switch-org.component';
import { WindowMessageService } from './shared/service/window-message.service';

declare const Favico: any;

const TIME_TO_CHECK_SESSION_IN_SECONDS = 15;
const WARNING_BLOCK_HEIGHT = 54;
const SUPPORT_WEBSOCKET_DOMAIN = ['portal.b3networks.com', 'portal.hoiio.net', 'localhost'];

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  readonly SocketStatus = SocketStatus;
  loading: boolean;
  isLoggedIn: boolean;
  showSidebar = false;
  loginAsData: HashMap<any>;
  isSecondOpenSocket: boolean;
  isSupportWS: boolean;

  sessionExpiryTimerSub$: Subscription;

  favicon: any;

  offsetTop = 0;
  warningBlockHeight = 0;
  socketStatus$: Observable<SocketStatus>;

  private _watchingWSStatus$: Subscription;

  private _sessionExpiryTimerSub$: Subscription;
  private _destroyWebsocket$ = new Subject();
  private _destroyNavigationEnd$ = new Subject();
  private _destroySessionToken$ = new Subject();

  get isLoginAsSession(): boolean {
    return this.loginAsData != null && !!this.loginAsData['orgUuid'];
  }

  constructor(
    private sessionQuery: SessionQuery,
    private sessionService: SessionService,
    private tfaQuery: TfaInfoQuery,
    private tfaService: TfaService,
    private securityQuery: SecurityComplianceQuery,
    private securityService: SecurityService,
    private applicationQuery: ApplicationQuery,
    private applicationService: ApplicationService,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private appStateQuery: AppStateQuery,
    private appStateService: AppStateService,
    private partnerService: PartnerService,
    private portalConfigQuery: PortalConfigQuery,
    private portalConfigService: PortalConfigService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private windowService: WindowMessageService,
    private browserNotification: BrowserNotificationService,
    private renderer: Renderer2,
    private title: Title,
    private dialog: MatDialog,
    private chatService: ChatService,
    private windownActiveService: WindownActiveService,
    private timeService: TimeService
  ) {
    this.loginAsData = buildUrlParameter();
    this._handleNavigateEvents();
    this._initNonSessionData(); // this request don't need session at all
    this.windowService.init();

    this.isSupportWS = SUPPORT_WEBSOCKET_DOMAIN.some(domain => location.origin.includes(domain));
    if (this.isSupportWS) {
      sessionStorage.setItem(PORTAL_BASE_HANDLE_WS, 'true');
    }
  }

  ngOnInit() {
    this._destroySessionToken$.next(true); // completed current subscriber and

    const loadedapps = this.applicationQuery.allRenderedApplications;
    if (loadedapps && loadedapps.length) {
      this.applicationService.closeApps(loadedapps);
    }

    this.sessionQuery.isLoggedIn$.pipe(distinctUntilChanged()).subscribe(async loggedIn => {
      console.log(`Is logged in ${loggedIn}`);
      if (loggedIn) {
        this.isLoggedIn = true;
        this.processValidSession();
      } else {
        let hasValidSession = false;
        if (!this.sessionQuery.isValidatedSession) {
          hasValidSession = await this.sessionService.checkSessionExpiry().toPromise();
          console.log(`Still has valid session ${hasValidSession}`);
        }

        if (!hasValidSession && this.sessionQuery.hasRememberMe) {
          const refreshed = await this.sessionService.refreshSession();
          if (!refreshed) {
            if (this.isSupportWS) {
              this.destroyOldWebsocket();
              this.chatService.normalClose();
            }
            this._go2loginPage();
          }
        } else if (!hasValidSession) {
          if (this.isSupportWS) {
            this.destroyOldWebsocket();
            this.chatService.normalClose();
          }
          this._go2loginPage();
        }
      }
    });

    this.addStripeJs();
  }

  ngOnDestroy() {
    this._destroyNavigationEnd$.next(true);
    this._destroyNavigationEnd$.complete();

    this._destroySessionToken$.next(true);
    this._destroySessionToken$.complete();

    this._destroyWebsocket$.next(true);
    this._destroyWebsocket$.complete();
  }

  manualConnect() {
    this.chatService.reconnect({ forceReset: true, reason: 'manual Connect' });
  }

  private processValidSession() {
    this.watchUserProfile();
    this.watchCompliantInfo();

    this.initPortalSettings();

    this.registerNotification();

    this.appStateQuery.loading$.pipe(distinctUntilChanged(), takeUntil(this._destroySessionToken$)).subscribe(value => {
      setTimeout(() => {
        this.loading = value;
      }, 0);
    });

    this.sessionExpiryTimerSub$ = timer(
      TIME_TO_CHECK_SESSION_IN_SECONDS * 1000,
      TIME_TO_CHECK_SESSION_IN_SECONDS * 1000
    )
      .pipe(takeUntil(this._destroySessionToken$))
      .subscribe(async () => {
        const expiryInSeconds = differenceInSeconds(this.sessionQuery.getValue().sessionExpipryAt, new Date());

        if (expiryInSeconds <= TIME_TO_CHECK_SESSION_IN_SECONDS) {
          if (this.sessionQuery.hasRememberMe) {
            // do for first time go to app
            // cannot do at constructor on session service when it's conflict with interceptor
            await this.sessionService.refreshSession();
          } else {
            setTimeout(async () => {
              await this.sessionService.checkSessionExpiry();
            }, (expiryInSeconds + 1) * 1000);
            this.sessionExpiryTimerSub$.unsubscribe();
          }
        }
      });
  }

  private watchUserProfile() {
    this.sessionQuery.profile$
      .pipe(
        filter(profile => profile != null),
        takeUntil(this._destroySessionToken$)
      )
      .subscribe(profile => {
        if (profile.organizations.length === 0) {
          this.router.navigate(['account']);
        }
      });

    this.sessionQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        takeUntil(this._destroySessionToken$)
      )
      .subscribe(org => {
        this.updatePageTitle();
        if (this.isSupportWS) {
          this.initChat(org);
        }

        // TODO need verify this flow. When user switch org, we don't reload the app.
        // So it should keep ws connection and broadcast message to child iframe
        // Then we need place to keep ws connection
        const subscription = this.applicationQuery
          .selectCountChatApplications(org.orgUuid)
          .pipe(takeUntil(this._destroySessionToken$))
          .subscribe(count => {
            if (count > 0) {
              setTimeout(() => {
                if (subscription) {
                  subscription.unsubscribe();
                }
              }, 0);
            }
          });

        this.applicationQuery
          .selectNotificationCount(org.orgUuid)
          .pipe(takeUntil(this._destroySessionToken$), distinctUntilChanged())
          .subscribe(totalCount => {
            if (!this.favicon) {
              this.favicon = new Favico({ animation: 'none' });
            }
            if (totalCount > 9) {
              this.favicon.badge(`9+`);
            } else if (totalCount > 0) {
              this.favicon.badge(totalCount);
            } else {
              this.favicon.reset();
            }
          });
      });

    this.sessionService
      .getProfile()
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(profile => {
        let userNotBelongSpecificOrg: boolean;
        let currentOrg: ProfileOrg;

        const url = this.router.url;
        const rs: RegExpMatchArray = url.match(UUID_V4_REGEX);
        if (rs && rs.index === 1) {
          const orgUuid = url.substring(1, 37);

          currentOrg = orgUuid ? profile.organizations.find(o => o.orgUuid === orgUuid) : null;
          userNotBelongSpecificOrg = currentOrg == null;
          console.log(
            `Detected user start with specific org ${orgUuid} and find out him ${
              userNotBelongSpecificOrg ? ' not belong to this org' : 'belong to this org'
            }`
          );
        } else if (this.isLoginAsSession) {
          currentOrg = profile.organizations.find(o => o.orgUuid === this.loginAsData['orgUuid']);
          console.log(
            `Detected admin start to login as to org ${this.loginAsData['orgUuid']} and find out him ${
              currentOrg == null ? ' not belong to this org' : 'belong to this org'
            }`
          );
        }
        if (userNotBelongSpecificOrg) {
          console.log(`User has only one org, navigate to this org now...`);
          this.router.navigate(['access-denied']);
        } else if (
          !currentOrg &&
          (profile.organizations.length === 1 ||
            (profile.organizations.length === 0 && this.sessionQuery.getValue().servicedOrgs.length === 1))
        ) {
          console.log(`User has only one org, navigate to this org now...`);
          currentOrg = profile.organizations[0] || this.sessionQuery.getValue().servicedOrgs[0];
          const appendedParams = url.split('/').filter(param => !!param && param !== currentOrg.orgUuid);
          this.router.navigate([currentOrg.orgUuid, appendedParams]);
        } else if (
          !currentOrg &&
          (profile.organizations.length > 1 || this.sessionQuery.getValue().servicedOrgs.length > 1) &&
          !location.hash.includes('/error')
        ) {
          console.log('User belong to multiple orgs, let user select one...');
          this.dialog.open(SwitchOrganizationDialog, {
            width: '500px',
            disableClose: true,
            data: <SwitchOrganizationData>{ disabledClose: true, activeApp: location.hash?.substring('#/'.length) }
          });
        } else if (currentOrg && this.isLoginAsSession) {
          console.log(`Navigate to login as org`);
          this.router.navigate([currentOrg.orgUuid, 'home']);
        }

        if (currentOrg) {
          this.sessionService.switchOrg(currentOrg);
        }
      });
  }

  private updatePageTitle() {
    const data = [];
    if (this.sessionQuery.currentOrg?.orgShortName) {
      data.push(this.sessionQuery.currentOrg?.orgShortName);
    }
    let child = this.activatedRoute.firstChild;

    if (!child && !!this.activatedRoute.snapshot.data['title']) {
      data.push(this.activatedRoute.snapshot.data['title']);
    } else {
      while (child?.firstChild) {
        child = child?.firstChild;
      }

      if (child.snapshot.data['title']) {
        data.push(child.snapshot.data['title']);
      }
    }

    const title = data.join(' | ');
    if (title) {
      this.title.setTitle(title);
    }
  }

  private watchCompliantInfo() {
    combineLatest([
      this.sessionQuery.currentOrg$,
      this.tfaQuery.tfaInfo$,
      this.securityQuery.securityCompliance$,
      this.applicationQuery.selectActiveId()
    ])
      .pipe(
        takeUntil(this._destroySessionToken$),
        filter(
          ([currentOrg, tfa, compliant]) =>
            currentOrg != null && Object.keys(tfa).length > 0 && Object.keys(compliant).length > 0
        ),
        distinctUntilChanged()
      )
      .subscribe(([currentOrg, tfa, compliant, _]) => {
        if (
          (currentOrg.isPartner && !tfa.tfaEnabled) ||
          (compliant.isActive && (compliant.passwordUpdateRequired || (compliant.tfaRequired && !tfa.tfaEnabled)))
        ) {
          setTimeout(() => {
            if (this.router.url.indexOf('security-check') === -1) {
              this.router.navigate(['security-check']);
            }
          }, 0);
          this.appStateService.toggleAppLoading(false);
          this.appStateService.toggleSidebar(false);
        } else if (this.showSidebar) {
          this.appStateService.toggleSidebar(this.showSidebar);
        }
      });

    this.sessionQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        takeUntil(this._destroySessionToken$)
      )
      .subscribe(_ => {
        forkJoin([this.tfaService.get2FaInfo(), this.securityService.getSecurityCompliance()]).subscribe();
      });
  }

  private registerNotification() {
    this.browserNotification.requestPermission().subscribe(
      () => {},
      error => {
        console.error(error);
      }
    );
  }

  private initPortalSettings() {
    this.personalSettingQuery.darkMode$
      .pipe(
        takeUntil(this._destroySessionToken$),
        filter(settings => settings != null)
      )
      .subscribe(darkMode => {
        if (darkMode) {
          this.renderer.addClass(document.body, 'b3-dark-theme');
        } else {
          this.renderer.removeClass(document.body, 'b3-dark-theme');
        }
      });
    this.personalSettingService.getPersonalSettings().subscribe();

    this.appStateQuery.showSidebar$
      .pipe(takeUntil(this._destroySessionToken$))
      .subscribe(setting => (this.showSidebar = setting));
  }

  private destroyOldWebsocket() {
    this._destroyWebsocket$.next(true);
    this._destroyWebsocket$.complete();
    this._destroyWebsocket$ = new Subject();

    this._watchingWSStatus$?.unsubscribe();
    this._watchingWSStatus$ = null;

    this.isSecondOpenSocket = false;
  }

  private initChat(org: ProfileOrg) {
    this.destroyOldWebsocket();

    this.chatService
      .initChat({ orgUuid: org.orgUuid, isV2: true })
      .pipe(takeUntil(this._destroyWebsocket$))
      .subscribe(() => {
        // handle subscribe topic
        this.chatService.socketStatus$
          .pipe(
            filter(status => status === SocketStatus.opened),
            take(1)
          )
          .subscribe(() => {
            if (this.sessionQuery?.currentOrg?.orgUuid) {
              const topic = [...new Set(this.windowService.msgTopics[this.sessionQuery.currentOrg.orgUuid])];
              if (topic.length > 0) {
                this.chatService.subscribeTopic(topic).subscribe();
              }
            }
          });
      });

    this.chatService.session$.pipe(takeUntil(this._destroyWebsocket$)).subscribe(session => {
      if (session) {
        this.windowService.fireEventAllRegisters(EventMapName.onSession, session, org.orgUuid);
      }
    });

    this.chatService
      .onmessage()
      .pipe(takeUntil(this._destroyWebsocket$))
      .subscribe(message => {
        this.windowService.fireEventOnMessage(message, org.orgUuid);
      });

    this.chatService.socketStatus$
      .pipe(
        distinctUntilChanged(),
        takeUntil(this._destroyWebsocket$),
        tap(status => {
          this.windowService.fireEventAllRegisters(EventMapName.socketStatus, status, org.orgUuid);

          if (status === SocketStatus.closed) {
            // only show reconnect when try but failed on the first time
            if (this.chatService.state.reconnectStragery.reconnectTimes > 0) {
              this.warningBlockHeight = WARNING_BLOCK_HEIGHT;
            }
          } else if (status === SocketStatus.opened) {
            this.warningBlockHeight = 0;
            if (this.isSecondOpenSocket) {
              this.reloadAfterSuccessReconnected();
            } else {
              this.isSecondOpenSocket = true;
              if (!this._watchingWSStatus$) {
                this._watchingWSStatus$ = timer(0, 30000)
                  .pipe(filter(() => this.windownActiveService.windowActiveStatus))
                  .subscribe(_ => {
                    // check invaild-token ws
                    this.timeService.getTsTime().subscribe(
                      () => {},
                      (err: HttpErrorResponse) => {
                        if (err?.status === 401 && err?.error === 'invalid-token') {
                          this.chatService.clearWs();
                          this.chatService.initChat({ orgUuid: X.orgUuid, bypass: true, isV2: true }).subscribe();
                        }
                      }
                    );
                  });
              }
            }
          }
          // this.offsetTop = this.warningBlockHeight;
          // document.documentElement.style.setProperty('--app__warning--height', this.warningBlockHeight + 'px');
        })
      )
      .subscribe();
  }

  private reloadAfterSuccessReconnected() {
    if (this.sessionQuery?.currentOrg?.orgUuid) {
      const topic = [...new Set(this.windowService.msgTopics[this.sessionQuery.currentOrg.orgUuid])];
      if (topic.length > 0) {
        this.chatService.subscribeTopic(topic).subscribe();
      }
    }
  }

  private _initNonSessionData() {
    setTimeout(() => {
      this.favicon = new Favico({
        animation: 'none'
      });
    });

    this.partnerService.getPartnerByDomain().subscribe();
    this.portalConfigService.getPortalConfig().subscribe();

    this._registerCustomIcons();
  }

  private _registerCustomIcons() {
    const icons = [
      { name: 'pin', icon: 'assets/icons/pin.svg' },
      { name: 'unpin', icon: 'assets/icons/unpin.svg' },
      { name: 'user', icon: 'assets/icons/user.svg' },
      { name: 'application', icon: 'assets/icons/application.svg' },
      { name: 'unified_workspace', icon: 'assets/icons/unified_workspace.svg' },
      { name: 'dashboard', icon: 'assets/icons/dashboard.svg' },
      { name: 'flow', icon: 'assets/icons/flow.svg' },
      { name: 'photo', icon: 'assets/icons/photo.svg' },
      { name: 'hub', icon: 'assets/icons/hub_outlined.svg' },
      { name: 'spoke', icon: 'assets/icons/spoke.svg' },
      { name: 'podcasts', icon: 'assets/icons/podcasts.svg' },
      { name: 'move', icon: 'assets/icons/move.svg' },
      { name: 'zoom_in', icon: 'assets/icons/zoom_in.svg' },
      { name: 'zoom_out', icon: 'assets/icons/zoom_out.svg' },
      { name: 'ms_signin', icon: 'assets/icons/ms_signin.svg' }
    ];

    icons.forEach(x => {
      this.matIconRegistry.addSvgIcon(x.name, this.domSanitizer.bypassSecurityTrustResourceUrl(x.icon));
    });
  }

  private addStripeJs() {
    this.portalConfigQuery.portalConfig$.pipe(takeUntil(this._destroySessionToken$)).subscribe(portalConfig => {
      if (portalConfig.allowTopup) {
        const scriptV2 = document.createElement('script');
        scriptV2.type = 'text/javascript';
        scriptV2.src = 'https://js.stripe.com/v2/';
        document.head.appendChild(scriptV2);
        const scriptV3 = document.createElement('script');
        scriptV3.type = 'text/javascript';
        scriptV3.src = 'https://js.stripe.com/v3/';
        document.head.appendChild(scriptV3);
      }
    });
  }

  private _handleNavigateEvents() {
    const navigationEnd$ = this.router.events.pipe(
      filter(evt => evt instanceof NavigationEnd),
      map(e => e as NavigationEnd)
    );

    // once time
    navigationEnd$.pipe(takeUntil(this._destroyNavigationEnd$)).subscribe(event => {
      if (this.activatedRoute.firstChild) {
        if (this.activatedRoute.firstChild.component?.['name'] === MainViewComponent?.name) {
          if (
            this.activatedRoute.firstChild.firstChild &&
            this.activatedRoute.firstChild.firstChild.snapshot.routeConfig.path === '**'
          ) {
            const orgUuid = this.activatedRoute.firstChild.snapshot.params['orgUuid'];
            const view = this.activatedRoute.firstChild.snapshot.params['view'];

            if (!!orgUuid && !!view) {
              const path = this.getPath(event.url, orgUuid, view);
              if (path) {
                this.applicationQuery
                  .selectApplicationbyId(orgUuid, view)
                  .pipe(
                    filter(x => x != null),
                    take(1)
                  )
                  .subscribe(app => {
                    this.applicationService.setMoreQueryForIframe(app, {
                      path: [path]
                    });
                    this._destroyNavigationEnd$.next(true);
                    this._destroyNavigationEnd$.complete();
                  });
              }
            }
          }
        }
      }
      this._destroyNavigationEnd$.next(true);
      this._destroyNavigationEnd$.complete();
    });

    // tracking url of iframe to binding 2 way
    navigationEnd$
      .pipe(
        filter(
          () =>
            !!this.activatedRoute.firstChild &&
            this.activatedRoute.firstChild.component &&
            this.activatedRoute.firstChild.component['name'] === MainViewComponent.name
        ),
        distinctUntilKeyChanged('url'),
        debounceTime(200)
      )
      .subscribe(event => {
        const orgUuid = this.activatedRoute.firstChild.snapshot.params['orgUuid'];
        const view = this.activatedRoute.firstChild.snapshot.params['view'];
        const url = decodeURIComponent(event.url);
        if (!!orgUuid && !!view) {
          const path = this.getPath(url, orgUuid, view);
          if (path) {
            this.applicationQuery
              .selectApplicationbyId(orgUuid, view)
              .pipe(
                filter(x => x != null),
                take(1)
              )
              .subscribe(app => {
                if (app?.lastNavigate != null && app?.lastNavigate !== path) {
                  this.windowService.fireEventAllRegisters(
                    EventMapName.changedNavigateRouter,
                    {
                      path: path
                    },
                    orgUuid
                  );
                }
              });
          }
        }
      });

    navigationEnd$.subscribe(evt => {
      if (evt instanceof NavigationEnd && this.activatedRoute.firstChild) {
        this.appStateService.toggleSidebar(this.activatedRoute.firstChild.snapshot.data['showMainSidebar'] !== false);
      }
      this.updatePageTitle();
    });
  }

  private getPath(path: string, orgUuid: string, view: string) {
    if (path.startsWith(`/${orgUuid}/`)) {
      path = path.substring(`/${orgUuid}/`.length);
    }
    if (path.startsWith(`${view}`)) {
      path = path.substring(`${view}`.length);
    }
    while (path.startsWith('/')) {
      path = path.substring(1);
    }
    if (path.includes(';')) {
      path = path.split(';')[0];
    }
    if (path.includes('?')) {
      path = path.split('?')[0];
    }

    return path;
  }

  private _go2loginPage() {
    if (!this.router.url.includes('auth')) {
      this.router.navigate(['auth']);
    }
  }
}
