import { BreakpointObserver, Breakpoints, BreakpointState } from '@angular/cdk/layout';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, HostListener, OnInit, Renderer2, ViewChild } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatDrawer } from '@angular/material/sidenav';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { ApprovalWorkspaceService } from '@b3networks/api/approval';
import {
  IdentityProfileQuery,
  IdentityProfileService,
  MemberRole,
  OrganizationPolicyService,
  OrganizationService
} from '@b3networks/api/auth';
import { StaffExtensionService, SubscriptionService } from '@b3networks/api/bizphone';
import { EventBookingService } from '@b3networks/api/booking';
import { WebrtcQuery, WebrtcService } from '@b3networks/api/call';
import {
  AgentService,
  ExtensionService,
  FindAgentsReq,
  MeService as CCMeService,
  OrgConfigService
} from '@b3networks/api/callcenter';
import { ContactService } from '@b3networks/api/contact';
import { InboxesService } from '@b3networks/api/inbox';
import {
  RequestDetailLeaves,
  RequestLeave,
  RequestLeaveService,
  ResponseRequestLeaves,
  TypeRequestLeave
} from '@b3networks/api/leave';
import { MeQuery as MeLicenseQuery, MeService as LicenseMeService } from '@b3networks/api/license';
import { PersonalSettingsQuery, PersonalSettingsService, UnifiedWorkspaceSetting } from '@b3networks/api/portal';
import {
  ActiveIframeService,
  CannedResponseService,
  ChannelService,
  ChatMessage,
  ChatService,
  ChatSession,
  ChatTopic,
  HyperspaceService,
  IntegrationService,
  MediaService,
  MeQuery,
  SocketStatus,
  TemplateMessageService,
  TimeService,
  UserQuery,
  UserService,
  UserStatus,
  WindownActiveService
} from '@b3networks/api/workspace';
import {
  AppQuery,
  APPROVAL_BOT_NAME,
  AppService,
  ConvoHelperService,
  InfoShowMention,
  LogInfo,
  LogStrageryService,
  MessageReceiveProcessor,
  ModeSidebar,
  RECEIVE_MSG_TYPE_UNIFIED_WORKSPACE,
  RIGHT_SIDEBAR_ID
} from '@b3networks/chat/shared/core';
import {
  APP_IDS,
  CallbackEventData,
  ChangedNavigateRouterData,
  DestroySubscriberComponent,
  EventMapName,
  isLocalhost,
  LocalStorageUtil,
  MethodName,
  PORTAL_BASE_HANDLE_WS,
  RegisterWebSocket,
  USER_INFO,
  X
} from '@b3networks/shared/common';
import { getTime, set } from 'date-fns';
import { format } from 'date-fns-tz';
import { combineLatest, forkJoin, Observable, of, timer } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

const WARNING_BLOCK_HEIGHT = 54;

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatDrawer) draw: MatDrawer;
  @ViewChild(MatMenuTrigger) renderMenuComp: MatMenuTrigger;

  RIGHT_SIDEBAR_ID = RIGHT_SIDEBAR_ID;

  showRightSidebar$: Observable<boolean>;
  modeRightSidebar$: Observable<ModeSidebar>;

  showLeftSidebar$: Observable<boolean>;
  modeLeftSidebar$: Observable<ModeSidebar>;
  disableCloseLeftSidebar: boolean; // when side mode

  isLoading = true;

  offsetTop = 0;
  warningBlockHeight = 0;
  socketStatus$: Observable<SocketStatus>;

  // menu mention
  memberMenu$: Observable<InfoShowMention>;

  readonly SocketStatus = SocketStatus;

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: any) {
    const session = this.webrtcQuery.session;
    if (!session) {
      return true;
    }
    event.returnValue = 'Something';
    return 'Something';
  }

  @HostListener('window:unload', ['$event'])
  onUnload() {
    this.webrtcService.doRejectCall();
  }

  constructor(
    private meQuery: MeQuery,
    private router: Router,
    private userService: UserService,
    private userQuery: UserQuery,
    private chatService: ChatService,
    private messageProcessor: MessageReceiveProcessor,
    private integrationService: IntegrationService,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    private timeService: TimeService,
    private identityProfileService: IdentityProfileService,
    private identityProfileQuery: IdentityProfileQuery,
    private webrtcQuery: WebrtcQuery,
    private webrtcService: WebrtcService,
    private personalSettingService: PersonalSettingsService,
    private subscriptionService: SubscriptionService,
    private renderer: Renderer2,
    private staffExtensionService: StaffExtensionService,
    private personalSettingsQuery: PersonalSettingsQuery,
    private route: ActivatedRoute,
    private cannedResponseService: CannedResponseService,
    private templateMessageService: TemplateMessageService,
    private agentService: AgentService,
    private orgConfigService: OrgConfigService,
    private channelService: ChannelService,
    private convoHelper: ConvoHelperService,
    private orgService: OrganizationService,
    private ccMeService: CCMeService,
    private eventBookingService: EventBookingService,
    private contactService: ContactService,
    private orgPolicyService: OrganizationPolicyService,
    private licenseMeService: LicenseMeService,
    private meLicenseQuery: MeLicenseQuery,
    private extensionService: ExtensionService,
    private mediaService: MediaService,
    private requestLeaveService: RequestLeaveService,
    private hyperspaceService: HyperspaceService,
    private appService: AppService,
    private appQuery: AppQuery,
    private breakpointObserver: BreakpointObserver,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService,
    private approvalWorkspaceService: ApprovalWorkspaceService,
    private logStrageryService: LogStrageryService,
    private elr: ElementRef,
    private inboxesService: InboxesService
  ) {
    super();
    this.registerCustomIcons();
    this.activeIframeService.initListenEvent(APP_IDS.UNIFIED_WORKSPACE);

    const hasSupportWebsocket = isLocalhost() ? true : sessionStorage.getItem(PORTAL_BASE_HANDLE_WS);
    console.log('hasSupportWebsocket: ', hasSupportWebsocket);
    if (environment?.useWebSoketPortal && !!hasSupportWebsocket) {
      this.chatService.state.useWebSoketPortal = true;
      this.meQuery.me$
        .pipe(
          filter(me => me != null),
          takeUntil(this.destroySubscriber$),
          take(1)
        )
        .subscribe(me => {
          X.fireMessageToParent(MethodName.RegisterWebsocket, <RegisterWebSocket>(<unknown>{
            mt: RECEIVE_MSG_TYPE_UNIFIED_WORKSPACE,
            topics: [ChatTopic.TEAM, ChatTopic.SUPPORT]
          }));

          let sessionTemp: ChatSession;
          X.registerListener(EventMapName.onSession, session => {
            sessionTemp = session;

            if (session) {
              this.chatService.updateSessionChat(new ChatSession(session));

              X.removeEventListener(EventMapName.onMessage); // remove old registerListener when reconnect ws
              X.registerListener(EventMapName.onMessage, message => {
                this.chatService.emitMessage(new ChatMessage(message));
              });

              let socketStatus: SocketStatus;
              X.removeEventListener(EventMapName.socketStatus); // remove old registerListener when reconnect ws
              X.registerListener(EventMapName.socketStatus, status => {
                socketStatus = status;
                this.chatService.updateSocketStatus(status);
              });

              if (socketStatus !== SocketStatus.opened) {
                X.fireMessageToParent(MethodName.CallbackEventData, <CallbackEventData>{
                  eventName: EventMapName.socketStatus
                });
              }
            }
          });
          if (!sessionTemp) {
            X.fireMessageToParent(MethodName.CallbackEventData, <CallbackEventData>{
              eventName: EventMapName.onSession
            });
          }
        });
    } else {
      this.chatService.state.useWebSoketPortal = false;
    }
  }

  ngOnInit() {
    this.trackingResponsive();
    this.watchSidebar();
    this.navigateModule();

    this.initPortalSettings();
    this.initLicenseSubscription();
    this.initAppData();
    this.initMe();
    this.initMemberMenu();

    setTimeout(() => {
      this.minorFetchApi();
    }, 5000);
  }

  menuClosed() {
    const menu = this.elr.nativeElement.querySelector('.trigger-mention-menu') as HTMLElement;
    if (menu) {
      menu.style.display = 'none';
    }
  }

  manualConnect() {
    this.chatService.reconnect({ forceReset: true, reason: 'manual Connect' });
  }

  closedRightSidebar($event) {
    const mode = this.appQuery.getValue()?.modeRightSidebar;
    if (mode === ModeSidebar.over) {
      this.appService.update({
        showRightSidebar: false
      });
    }
  }

  closedLeftSidebar($event) {
    const mode = this.appQuery.getValue()?.modeLeftSidebar;
    if (mode === ModeSidebar.over) {
      this.appService.update({
        showLeftSidebar: false
      });
    }
  }

  private minorFetchApi() {
    this.inboxesService.getAll().subscribe();
    this.initWhatsapp();
    this.initLeaveIntegrate();
    this.extensionService.getAllExtenison().subscribe();
    this.contactService.get().subscribe();
    this.eventBookingService.getBookingUpcoming().subscribe();
    this.orgService.getOrganizationByUuid(X.getContext()[USER_INFO.orgUuid]).subscribe();
  }

  private trackingResponsive() {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe((state: BreakpointState) => {
        if (state.breakpoints[Breakpoints.XSmall]) {
          this.appService.update({
            modeLeftSidebar: ModeSidebar.over,
            showLeftSidebar: false,
            modeRightSidebar: ModeSidebar.over
          });
        }
        if (state.breakpoints[Breakpoints.Small]) {
          this.appService.update({
            modeLeftSidebar: ModeSidebar.over,
            showLeftSidebar: false,
            modeRightSidebar: ModeSidebar.over
          });
        }
        if (state.breakpoints[Breakpoints.Medium]) {
          this.appService.update({
            modeLeftSidebar: ModeSidebar.side,
            showLeftSidebar: true,
            modeRightSidebar: ModeSidebar.over
          });
        }
        if (state.breakpoints[Breakpoints.Large]) {
          this.appService.update({
            modeLeftSidebar: ModeSidebar.side,
            showLeftSidebar: true,
            modeRightSidebar: ModeSidebar.side
          });
        }
        if (state.breakpoints[Breakpoints.XLarge]) {
          this.appService.update({
            modeLeftSidebar: ModeSidebar.side,
            showLeftSidebar: true,
            modeRightSidebar: ModeSidebar.side
          });
        }
      });
  }

  private navigateModule() {
    X.registerListener(EventMapName.changedNavigateRouter, (data: { path: string }) => {
      console.log('listener: UW', data?.path);
      if (data?.path) {
        let pathDecode = decodeURIComponent(data.path);
        if (pathDecode.includes(';')) {
          pathDecode = pathDecode.split(';')[0];
        }
        if (pathDecode.includes('?')) {
          pathDecode = pathDecode.split('?')[0];
        }
        this.router.navigate([pathDecode]);
      }
    });

    this.router.events
      .pipe(
        filter(evt => evt instanceof NavigationEnd && !!this.route.firstChild),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(event => {
        let path = (event as NavigationEnd).url;
        if (path.includes(';')) {
          path = path.split(';')[0];
        }
        if (path.includes('?')) {
          path = path.split('?')[0];
        }
        if (path.startsWith('/')) {
          path = path.substring(1);
        }
        X.fireMessageToParent(MethodName.ChangedNavigateRouter, <ChangedNavigateRouterData>{
          path: path
        });
      });

    this.router.events
      .pipe(
        filter(evt => evt instanceof NavigationEnd && !this.route.firstChild),
        takeUntil(this.destroySubscriber$),
        take(1)
      )
      .subscribe(() => {
        const params = this.route.snapshot.queryParams;
        console.log('firstChild: ', params);
        const lastestView = LocalStorageUtil.getItem(`lastestView_v1_${X.orgUuid}`);
        if (params['id']) {
          this.router.navigate(['conversations', params['id']]);
        } else if (params['path']) {
          let pathDecode = decodeURIComponent(params['path']);
          if (pathDecode.includes(';')) {
            pathDecode = pathDecode.split(';')[0];
          }
          if (pathDecode.includes('?')) {
            pathDecode = pathDecode.split('?')[0];
          }

          if (params['convoChildId']) {
            // email
            this.router.navigate([pathDecode, { convoChildId: params['convoChildId'] }], {
              queryParamsHandling: 'merge'
            });
          } else {
            this.router.navigate([pathDecode]);
          }
        } else if (lastestView) {
          this.router.navigate([decodeURIComponent(lastestView)]);
        } else {
          this.router.navigate(['landing']);
        }
      });
  }

  private initMe() {
    this.identityProfileService.getProfile().subscribe(profile => {
      this.staffExtensionService.getStaffExtension(profile.uuid).subscribe();
    });

    this.integrationService.get().subscribe(interations => {
      const findApprovalBot = interations.find(i => i.name === APPROVAL_BOT_NAME);
      if (findApprovalBot) {
        this.approvalWorkspaceService.checkBot(findApprovalBot.msChatUuid).subscribe(res => {
          if (res.isApprovalBot) {
            this.integrationService.updateStateStore({
              approvalBot: findApprovalBot.msChatUuid
            });
          }
        });
      }
    });

    this.ccMeService.get(true).subscribe(me => {
      const extKey = me?.extKey;
      if (extKey) {
        this.extensionService.getDelegatedCallerId(extKey).subscribe();
      }
    });
  }

  private initHyperspace() {
    combineLatest([
      this.identityProfileQuery.roleCurrentOrg$.pipe(filter(x => x != null)),
      this.meLicenseQuery.hasTeamChatLicense$.pipe(filter(hasTeamChatLicense => hasTeamChatLicense))
    ])
      .pipe(take(1), takeUntil(this.destroySubscriber$))
      .subscribe(([role, _]) => {
        if (role === MemberRole.OWNER) {
          this.hyperspaceService
            .getHyperspacesByOrg(X.orgUuid)
            .pipe(switchMap(() => this.hyperspaceService.getHyperspacesByMember(X.orgUuid)))
            .subscribe();
        } else {
          this.hyperspaceService.getHyperspacesByMember(X.orgUuid).subscribe();
        }
      });
  }

  private initAppData() {
    this.isLoading = true;
    const initChat = this.logStrageryService.addJob('initChat');
    let count = 0;
    forkJoin([
      this.userService.getMe().pipe(
        tap(() => {
          this.chatService.socketStatus$
            .pipe(
              filter(status => status === SocketStatus.opened),
              takeUntil(this.destroySubscriber$)
            )
            .subscribe(() => {
              this.logStrageryService.startJob();
              this.fetchChannel();
              if (count > 0) {
                // fetch all user -> detect new user
                this.userService.fetchAllUsersV2().subscribe();
              }
              count++;
            });
        })
      ),
      this.userService.fetchAllUsersV2().pipe(tap(() => this.userService.getAgents().subscribe())),
      this.orgConfigService.getConfig(),
      (!this.chatService.state.useWebSoketPortal ? this.chatService.initChat({ orgUuid: X.orgUuid }) : of(null)).pipe(
        tap(() =>
          this.logStrageryService.updateJob(initChat, <LogInfo>{
            status: true
          })
        ),
        catchError(err => {
          this.logStrageryService.updateJob(initChat, <LogInfo>{
            status: false,
            reason: err?.message
          });
          return err;
        })
      )
    ])
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe();

    this.chatService
      .onmessage()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(message => {
        try {
          this.messageProcessor.process(message);
        } catch (error) {
          console.log(error);
        }
      });

    let tapFirst = false;
    this.socketStatus$ = this.chatService.socketStatus$.pipe(
      tap(status => {
        if (status === SocketStatus.closed) {
          // only show reconnect when try but failed on the first time
          if (
            !this.chatService.state.useWebSoketPortal &&
            this.chatService.state.reconnectStragery.reconnectTimes > 0
          ) {
            this.warningBlockHeight = WARNING_BLOCK_HEIGHT;
          }
          this.convoHelper.updateIsDisconnectedUIState(true);
        } else if (status === SocketStatus.opened) {
          this.warningBlockHeight = 0;

          if (!tapFirst) {
            tapFirst = true;
            if (!this.chatService.state.useWebSoketPortal) {
              timer(5000, 30000)
                .pipe(
                  takeUntil(this.destroySubscriber$),
                  filter(() => this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe)
                )
                .subscribe(_ => {
                  // check invaild-token ws
                  this.timeService.getTsTime().subscribe(
                    () => {},
                    (err: HttpErrorResponse) => {
                      this.convoHelper.updateIsDisconnectedUIState(true);
                      if (err?.status === 401 && err?.error === 'invalid-token') {
                        this.chatService.clearWs();
                        this.chatService.initChat({ orgUuid: X.orgUuid, bypass: true }).subscribe();
                      }
                    }
                  );
                });
            }
          }
        }

        if (!this.chatService.state.useWebSoketPortal) {
          this.offsetTop = this.warningBlockHeight;
          document.documentElement.style.setProperty('--app__warning--height', this.warningBlockHeight + 'px');
        }
      })
    );
  }

  private initMemberMenu() {
    this.memberMenu$ = this.appQuery.memberMenu$.pipe(
      tap(info => {
        if (info) {
          const menu = this.elr.nativeElement.querySelector('.trigger-mention-menu') as HTMLElement;
          menu.style.display = '';
          menu.style.position = 'fixed';
          menu.style.left = info.xPosition + 5 + 'px';
          menu.style.top = info.yPosition + 5 + 'px';
          setTimeout(() => {
            this.renderMenuComp?.toggleMenu();
          });
        }
      })
    );
  }

  private initLicenseSubscription() {
    this.licenseMeService.getFeatures().subscribe();
    this.subscriptionService.get().subscribe();
    this.orgPolicyService.get(X.orgUuid).subscribe();
  }

  private fetchChannel() {
    // fetch timeOffset
    const getTsTime = this.logStrageryService.addJob('getTsTime');
    this.timeService.getTsTime().subscribe(
      () =>
        this.logStrageryService.updateJob(getTsTime, <LogInfo>{
          status: true
        }),
      err =>
        this.logStrageryService.updateJob(getTsTime, <LogInfo>{
          status: false,
          reason: err?.message
        })
    );

    this.channelService.updateRecentChannels(null).subscribe();

    // remove msg not active convo
    this.convoHelper.removeMsgWhenReconnected();

    // fetch conversation to get mention & unread count and detect has old histories
    this.meLicenseQuery.hasTeamChatLicense$
      .pipe(
        filter(hasTeamChatLicense => hasTeamChatLicense),
        take(1),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(() => {
        const getChannelsWithMe = this.logStrageryService.addJob('getChannelsWithMe');
        this.channelService.getChannelsWithMe(this.meQuery.getMe().userUuid, true).subscribe(
          () =>
            this.logStrageryService.updateJob(getChannelsWithMe, <LogInfo>{
              status: true
            }),
          err =>
            this.logStrageryService.updateJob(getChannelsWithMe, <LogInfo>{
              status: false,
              reason: err?.message
            })
        );

        const getPublicChannels = this.logStrageryService.addJob('getPublicChannels');
        this.channelService.getPublicChannels().subscribe(
          () =>
            this.logStrageryService.updateJob(getPublicChannels, <LogInfo>{
              status: true
            }),
          err =>
            this.logStrageryService.updateJob(getPublicChannels, <LogInfo>{
              status: false,
              reason: err?.message
            })
        );
      });

    // re-fetch channels to get more detail
    this.initHyperspace();
    this.hyperspaceService.updateHyperspaceViewState(null, { loadedMines: false }); // null = all hyperspace

    // fetch status for all user
    this.userService.changeStatusForUser(null, UserStatus.offline); // null = All users
    this.userService.initUsersStatus();

    setTimeout(() => {
      this.convoHelper.updateIsDisconnectedUIState(false);
    });
  }

  private watchSidebar() {
    this.modeRightSidebar$ = this.appQuery.modeRightSidebar$;
    this.modeLeftSidebar$ = this.appQuery.modeLeftSidebar$.pipe(
      tap(mode => (this.disableCloseLeftSidebar = mode === ModeSidebar.side))
    );
    this.showLeftSidebar$ = this.appQuery.showLeftSidebar$;

    this.showRightSidebar$ = this.router.events.pipe(
      filter(evt => evt instanceof NavigationEnd && !!this.route.firstChild),
      map(evt => {
        if ((<NavigationEnd>evt)?.url === '/conversations/bookmarks') {
          return false;
        }

        let firstChild = this.route.firstChild;
        let disableMainSidebar: boolean;
        while (firstChild) {
          disableMainSidebar = firstChild?.snapshot?.data['disableMainSidebar'];
          firstChild = disableMainSidebar ? null : firstChild?.firstChild;
        }
        return !disableMainSidebar;
      }),
      switchMap(isShow => {
        if (!isShow) {
          return of(false);
        }

        return this.appQuery.modeRightSidebar$.pipe(
          switchMap(mode =>
            mode === ModeSidebar.side
              ? this.personalSettingsQuery.selectAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE).pipe(
                  filter(s => s != null),
                  map(result => (result as UnifiedWorkspaceSetting).showRightSidebar)
                )
              : this.appQuery.showRightSidebar$
          )
        );
      })
    );
  }

  private registerCustomIcons() {
    const icons = [
      { name: 'call', icon: 'assets/icons/call.svg' },
      { name: 'inbound_call', icon: 'assets/icons/inbound_call.svg' },
      { name: 'outbound_call', icon: 'assets/icons/outbound_call.svg' },
      { name: 'chat', icon: 'assets/icons/chat.svg' },
      { name: 'email', icon: 'assets/icons/email.svg' },
      { name: 'livechat', icon: 'assets/icons/livechat.svg' },
      { name: 'sms', icon: 'assets/icons/sms.svg' },
      { name: 'whatsapp', icon: 'assets/icons/whatsapp.svg' },
      { name: 'user', icon: 'assets/icons/user.svg' },
      { name: 'follow', icon: 'assets/icons/eye.svg' },
      { name: 'checked', icon: 'assets/icons/checked.svg' },
      { name: 'signature', icon: 'assets/icons/document_signature.svg' },
      { name: 'tag', icon: 'assets/icons/tag.svg' },
      { name: 'email-plus', icon: 'assets/icons/email-plus.svg' },
      { name: 'email-search', icon: 'assets/icons/email-search.svg' },
      { name: 'team_chat', icon: 'assets/icons/team_chat.svg' },
      { name: 'team_inbox', icon: 'assets/icons/team_inbox.svg' },
      { name: 'inbox', icon: 'assets/icons/inbox.svg' },
      { name: 'email_chat', icon: 'assets/icons/email_chat.svg' },
      { name: 'group', icon: 'assets/icons/group.svg' },
      { name: 'member', icon: 'assets/icons/member.svg' }
    ];

    icons.forEach(x => {
      const url = this.domSanitizer.bypassSecurityTrustResourceUrl(x.icon);
      this.matIconRegistry.addSvgIcon(x.name, url);
    });
  }

  private initPortalSettings() {
    this.personalSettingService.getPersonalSettings().subscribe(res => {
      if (res.darkMode) {
        this.renderer.addClass(document.body, 'b3-dark-theme');
      } else {
        this.renderer.removeClass(document.body, 'b3-dark-theme');
      }

      // first Update settings
      let settings = <UnifiedWorkspaceSetting>(
        this.personalSettingsQuery.getAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
      );
      if (!settings) {
        settings = <UnifiedWorkspaceSetting>{
          orgUuid: X.orgUuid,
          appId: APP_IDS.UNIFIED_WORKSPACE,
          showRightSidebar: false
        };
        this.personalSettingService.updateAppSettings(settings).subscribe();
      }
    });

    setTimeout(() => {
      X.registerListener(EventMapName.updateDarkMode, darkMode => {
        if (darkMode) {
          this.renderer.addClass(document.body, 'b3-dark-theme');
        } else {
          this.renderer.removeClass(document.body, 'b3-dark-theme');
        }
      });
    }, 1000);
  }

  private initWhatsapp() {
    this.cannedResponseService.getCannedResponse().subscribe();
    this.templateMessageService.getTemplateV2().subscribe();
    this.agentService.findAgents(new FindAgentsReq()).subscribe();
  }

  private initLeaveIntegrate() {
    combineLatest([
      this.userQuery.selectStoreLoaded(),
      this.meLicenseQuery.hasTeamChatLicense$.pipe(filter(hasTeamChatLicense => hasTeamChatLicense))
    ])
      .pipe(takeUntil(this.destroySubscriber$), take(1))
      .subscribe(() => {
        // inveral 30 mins
        timer(0, 1800000)
          .pipe(takeUntil(this.destroySubscriber$))
          .subscribe(() => {
            this.fetchLeaveToday();
          });
      });
  }

  private fetchLeaveToday() {
    this.requestLeaveService
      .getUsersLeaveToday()
      .pipe(
        catchError(err => of(<ResponseRequestLeaves[]>[])),
        map((reqs: ResponseRequestLeaves[]) => {
          const arr: RequestLeave[] = [];
          reqs?.forEach(data => {
            const user = this.userQuery.getEntity(data.identityUuid);
            const timezone = user?.timezone ? user.timezone.substring(3, 8) : '+0800';
            const find = arr.find(x => x.identityUuid === data.identityUuid);
            const calc = this.calcDateWithPeriod(data.period, timezone);
            if (!calc) {
              return;
            }
            const req = new RequestDetailLeaves({
              period: data.period,
              startDate: getTime(new Date(calc.startDate)),
              endDate: getTime(new Date(calc.endDate)),
              type: data.type
            });
            if (find) {
              find.pushReqeustLeave(req);
            } else {
              arr.push(
                new RequestLeave({
                  identityUuid: data.identityUuid,
                  timezone: timezone,
                  timezoneMe: this.meQuery.getMe().utcOffset,
                  requestLeaves: [req]
                })
              );
            }
          });
          return arr;
        })
      )
      .subscribe(reqs => {
        this.requestLeaveService.setLeaveRequests(reqs);
      });
  }

  private calcDateWithPeriod(period: TypeRequestLeave, timezone: string) {
    if (period === TypeRequestLeave.AM) {
      const startAM = set(new Date(), { hours: 0, minutes: 0 });
      const endAM = set(new Date(), { hours: 11, minutes: 59 });
      return {
        startDate: format(startAM, "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        }),
        endDate: format(endAM, "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        })
      };
    } else if (period === TypeRequestLeave.PM) {
      const startPM = set(new Date(), { hours: 12, minutes: 0 });
      const endPM = set(new Date(), { hours: 23, minutes: 59 });
      return {
        startDate: format(startPM, "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        }),
        endDate: format(endPM, "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        })
      };
    } else if (period === TypeRequestLeave.FULL) {
      const start = set(new Date(), { hours: 0, minutes: 0 });
      const end = set(new Date(), { hours: 23, minutes: 59 });
      return {
        startDate: format(start, "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        }),
        endDate: format(end, "yyyy-MM-dd'T'HH:mm:ssxxx", {
          timeZone: timezone
        })
      };
    }
    return null;
  }
}
