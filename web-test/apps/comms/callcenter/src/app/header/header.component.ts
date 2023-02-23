import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material/snack-bar';
import { NavigationEnd, Router } from '@angular/router';
import {
  AgentStatus,
  LicenceType,
  Me,
  MeQuery,
  MeService,
  OrgConfigQuery,
  OrgConfigService,
  SystemStatusCode
} from '@b3networks/api/callcenter';
import {
  CallcenterAppSettings,
  CallcenterCallFeature,
  PersonalSettingsQuery,
  PersonalSettingsService
} from '@b3networks/api/portal';
import { FindSubscriptionReq, SubscriptionService } from '@b3networks/api/subscription';
import { AgentStatusChanged, BusyNoteComponent } from '@b3networks/comms/callcenter/shared';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { EventMessageService } from '@b3networks/shared/utils/message';
import { combineLatest, Observable } from 'rxjs';
import { filter, finalize, map, share, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

declare let window: any;
class HeaderData {
  agentLicence: LicenceType;
  callFeature: CallcenterCallFeature;

  hasInbound: boolean;
  hasOutbound: boolean;

  constructor(obj?: Partial<HeaderData>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get isSupervisor() {
    return this.agentLicence === LicenceType.supervisor;
  }

  get showDashboard() {
    return this.isSupervisor && (this.hasInbound || (!this.hasInbound && !this.hasOutbound));
  }

  get showFeatureSelection() {
    return this.hasOutbound && this.hasInbound;
  }
}

@Component({
  selector: 'b3n-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent extends DestroySubscriberComponent implements OnInit {
  readonly AgentStatus = AgentStatus;
  readonly SystemStatusCode = SystemStatusCode;

  links: KeyValue<string, string>[] = [];
  activeLink: KeyValue<string, string>;
  ip: string;

  isSharedForBoth: boolean;
  onlyOutbound: boolean;
  onlyInbound: boolean;
  currentNavName = 'Workspace';

  me$: Observable<Me>;
  data$: Observable<HeaderData>;
  awaySnacbarRef: MatSnackBarRef<SimpleSnackBar>;

  readonly CallcenterCallFeature = CallcenterCallFeature;

  constructor(
    private meQuery: MeQuery,
    private meService: MeService,
    private subscriptionService: SubscriptionService,
    private snackBar: MatSnackBar,
    private orgConfigQuery: OrgConfigQuery,
    private orgConfigService: OrgConfigService,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private router: Router,
    private spinnerService: LoadingSpinnerSerivce,
    private toastService: ToastService,
    private dialog: MatDialog,
    private eventBus: EventMessageService
  ) {
    super();
  }

  ngOnInit(): void {
    this.watchingUrlChanged();
    try {
      this.getIPs(ip => (this.ip = ip));
    } catch (e) {}

    this.checkIsAway();

    this.me$ = this.meQuery.me$;

    const getSubStream$ = this.subscriptionService
      .findSubscriptions(
        new FindSubscriptionReq({
          productIds: [environment.appId],
          embed: ['features']
        })
      )
      .pipe(share());

    //not sure why combinlasted not fire http event
    getSubStream$.subscribe();

    this.data$ = combineLatest([
      this.meQuery.licence$,
      this.personalSettingQuery.selectAppSettings(X.orgUuid, environment.appId),
      getSubStream$
    ]).pipe(
      takeUntil(this.destroySubscriber$),
      filter(([licence, _, subscriptionPage]) => licence != null && subscriptionPage != null),
      map(([licence, settings, subscriptionPage]) => {
        let hasInbound: boolean;
        let hasOutbound: boolean;

        subscriptionPage.data[0].items.forEach(item => {
          if (item.features.find(feature => feature.featureCode === environment.inboundFeatureCode)) {
            hasInbound = true;
          } else if (item.features.find(feature => feature.featureCode === environment.outboundFeatureCode)) {
            hasOutbound = true;
          }
        });

        let callFeature: CallcenterCallFeature;
        settings = <CallcenterAppSettings>(settings || { orgUuid: X.orgUuid, appId: environment.appId });
        callFeature = settings.callFeature;

        let unsynedCallFeature: boolean;
        if (callFeature == null) {
          callFeature =
            hasInbound || (!hasInbound && !hasOutbound)
              ? CallcenterCallFeature.inbound
              : CallcenterCallFeature.outbound;
          unsynedCallFeature = true;
        } else if (callFeature === CallcenterCallFeature.inbound && !hasInbound && hasOutbound) {
          callFeature = CallcenterCallFeature.outbound;
          unsynedCallFeature = true;
        } else if (callFeature === CallcenterCallFeature.outbound && !hasOutbound) {
          callFeature = CallcenterCallFeature.inbound;
          unsynedCallFeature = true;
        }

        if (unsynedCallFeature) {
          settings.callFeature = callFeature;
          this.personalSettingService.updateAppSettings(settings).subscribe();
        }

        return new HeaderData({
          agentLicence: licence,
          hasInbound: hasInbound,
          hasOutbound: hasOutbound,
          callFeature: callFeature
        });
      }),
      tap(data => {
        this.initLinks(data);
        if (!this.activeLink) {
          this.activeLink = this.links[0];
          this.router.navigate([this.activeLink.key]);
        }
      })
    );

    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(e => {
      const matches = this.links.map(l => l.key);

      const evt = <NavigationEnd>e;
      for (const match of matches) {
        if (evt.url.indexOf(match) > -1) {
          this.activeLink = this.links.find(l => l.key === match);
        }
      }
    });
  }

  changeCallDirection(type: CallcenterCallFeature, data: HeaderData) {
    if (type !== data.callFeature) {
      const settings = <CallcenterAppSettings>this.personalSettingQuery.getAppSettings(X.orgUuid, environment.appId);
      settings.callFeature = type;
      this.personalSettingService.updateAppSettings(settings).subscribe();
    }
  }

  browseTo(l: KeyValue<string, string>, data: HeaderData) {
    this.activeLink = l;
    if (this.activeLink.key === 'dashboard') {
      this.changeCallDirection(CallcenterCallFeature.inbound, data);
    }
    this.router.navigate([l.key]);
  }

  changeStatus(status: string) {
    switch (status) {
      case AgentStatus.available:
        this.login();
        break;
      case AgentStatus.dnd:
        this.dnd();
        break;
      case AgentStatus.busy:
        this.busy();
        break;
      case AgentStatus.offline:
        this.logout();
        break;
    }
  }

  private initLinks(data: HeaderData) {
    this.links = [{ key: 'workspace', value: 'Workspace' }];

    if (this.meQuery.getMe().isOwner || data.isSupervisor) {
      this.links.push({
        key: 'queue',
        value: 'Queue Management'
      });
      if (data.callFeature === CallcenterCallFeature.outbound) {
        this.links.push({ key: 'number-lists', value: 'Number Lists' });
      }
      this.links.push({ key: 'activities-log', value: 'Activities Log' }, { key: 'setting', value: 'Settings' });
    }
    if (data.showDashboard) {
      // push view for supervisor
      this.links.unshift({ key: 'dashboard', value: 'Dashboard' });
    }
  }

  private watchingUrlChanged() {
    this.router.events.pipe(filter(evt => evt instanceof NavigationEnd)).subscribe(route => {
      route = route as NavigationEnd;
      if (route.url.toString().includes('dashboard')) {
        this.currentNavName = 'Dashboard';
        this.isSharedForBoth = false;
        this.onlyOutbound = false;
        this.onlyInbound = true;
      } else if (route.url.toString().includes('number-lists')) {
        this.currentNavName = 'Numbers Management';
        this.isSharedForBoth = false;
        this.onlyOutbound = true;
        this.onlyInbound = false;
      } else if (route.url.toString().includes('workspace')) {
        this.currentNavName = 'Workspace';
        this.isSharedForBoth = false;
        this.onlyOutbound = false;
        this.onlyInbound = false;
      } else {
        this.isSharedForBoth = true;
        this.onlyOutbound = false;
        this.onlyInbound = false;
        if (route.url.toString().includes('queue')) {
          this.currentNavName = 'Queue';
        } else if (route.url.toString().includes('activities-log')) {
          this.currentNavName = 'Activities Log';
        } else if (route.url.toString().includes('setting')) {
          this.currentNavName = 'Setting';
        }
      }
    });
  }

  private busy() {
    this.dialog
      .open(BusyNoteComponent, {})
      .afterClosed()
      .subscribe(result => {
        if (result && result.reason) {
          this.spinnerService.showSpinner();
          this.meService
            .makeBusy(result.reason)
            .pipe(finalize(() => this.spinnerService.hideSpinner()))
            .subscribe(
              me => {
                this.eventBus.sendMessage(new AgentStatusChanged({ agent: me }));
                this.toastService.success('Change status to busy successfully');
              },
              err => {
                this.toastService.error(err.message);
              }
            );
        }
      });
  }

  private login() {
    this.spinnerService.showSpinner();
    this.meService
      .login(this.ip)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        me => {
          this.eventBus.sendMessage(new AgentStatusChanged({ agent: me }));
          this.toastService.success('Change status to available successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  private dnd() {
    this.spinnerService.showSpinner();
    this.meService
      .dnd()
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        me => {
          this.eventBus.sendMessage(new AgentStatusChanged({ agent: me }));
          this.toastService.success('Change status to away successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  private logout() {
    this.spinnerService.showSpinner();
    this.meService
      .logout()
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        me => {
          this.eventBus.sendMessage(new AgentStatusChanged({ agent: me }));
          this.toastService.success('Change status to offline successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  private checkIsAway() {
    combineLatest([this.orgConfigQuery.orgConfig$, this.meQuery.systemStatus$])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([orgConfig, systemStatus]) => {
        if (orgConfig.awayDetectionUnansweredThreshold && systemStatus === SystemStatusCode.away) {
          if (this.awaySnacbarRef) {
            this.awaySnacbarRef.dismiss();
          }
          this.awaySnacbarRef = this.snackBar.open(
            'The system detected you are away due to ' +
              orgConfig.awayDetectionUnansweredThreshold +
              ' consecutive unanswered calls. Make an outgoing call or update the status to remove it.',
            'Close',
            {
              duration: 5000,
              verticalPosition: 'bottom',
              horizontalPosition: 'center'
            }
          );
        }
      });

    this.orgConfigService.getConfig().subscribe();
  }

  private getIPs(callback) {
    const ip_dups = {};

    //compatibility for firefox and chrome
    let RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
    let useWebKit = !!window.webkitRTCPeerConnection;
    const iframe: any = document.getElementById('iframe');
    //bypass naive webrtc blocking using an iframe
    if (!RTCPeerConnection) {
      const win = iframe.contentWindow;
      RTCPeerConnection = win.RTCPeerConnection || win.mozRTCPeerConnection || win.webkitRTCPeerConnection;
      useWebKit = !!win.webkitRTCPeerConnection;
    }

    if (!RTCPeerConnection) {
      callback(null);
      return;
    }

    //minimal requirements for data connection
    const mediaConstraints = {
      optional: [{ RtpDataChannels: true }]
    };

    const servers = {
      iceServers: [{ urls: 'stun:stun.services.mozilla.com' }],
      sdpSemantics: 'plan-b'
    };

    //construct a new RTCPeerConnection
    const pc = new RTCPeerConnection(servers, mediaConstraints);

    function handleCandidate(candidate) {
      //match just the IP address
      const ip_regex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
      const ip = ip_regex.exec(candidate);
      if (ip === null || ip.length < 1) {
        return;
      }
      const ip_addr = ip[1];

      //remove duplicates
      if (ip_dups[ip_addr] === undefined) callback(ip_addr);
      ip_dups[ip_addr] = true;
    }

    //listen for candidate events
    pc.onicecandidate = function (ice) {
      //skip non-candidate events
      if (ice.candidate) handleCandidate(ice.candidate.candidate);
    };

    //create a bogus data channel
    if (typeof pc.createDataChannel === 'function') {
      pc.createDataChannel('');

      //create an offer sdp
      pc.createOffer(
        function (result) {
          //trigger the stun server request
          pc.setLocalDescription(
            result,
            function () {},
            function () {}
          );
        },
        function () {}
      );

      //wait for a while to let everything done
      setTimeout(function () {
        //read candidate info from local description
        const lines = pc.localDescription && pc.localDescription.sdp ? pc.localDescription.sdp.split('\n') : [];

        lines.forEach(function (line) {
          if (line.indexOf('a=candidate:') === 0) handleCandidate(line);
        });
      }, 1000);
    }
  }
}
