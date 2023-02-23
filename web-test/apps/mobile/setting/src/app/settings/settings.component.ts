import { AfterViewInit, ChangeDetectorRef, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfile, ProfileOrg } from '@b3networks/api/auth';
import { Extension } from '@b3networks/api/bizphone';
import { AgentStatus, ExtensionQuery, Me, MeQuery } from '@b3networks/api/callcenter';
import { SessionQuery, SessionService } from '@b3networks/portal/base/shared';
import { DestroySubscriberComponent, Platforms, postMsgToFlutter, X } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { SettingsStatusComponent } from './settings-status/settings-status.component';
import { SettingsSwitchComponent } from './settings-switch/settings-switch.component';
import { SettingsService } from './settings.service';

const STATUS = [
  { key: AgentStatus.available, value: 'Available' },
  { key: AgentStatus.busy, value: 'Busy' },
  { key: AgentStatus.dnd, value: 'Do Not Disturb' },
  { key: AgentStatus.offline, value: 'Offline' }
];

interface MSG {
  action: 'logout' | 'switchOrg' | 'loaded' | 'close';
  status: 'success' | 'fail';
  fromOrg?: string;
  toOrg?: string;
}

interface SettingControl {
  id: number;
  name: string;
  navigate: string;
  setStatus?: boolean;
  template?: string;
}

declare var CrossPlatformMobile: any;
declare var Android: any;
declare var webkit: any;

@Component({
  selector: 'b3n-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent extends DestroySubscriberComponent implements OnInit, AfterViewInit {
  readonly settingControls: SettingControl[] = [
    { id: 0, name: 'Status', navigate: 'status', setStatus: true },
    { id: 1, name: 'Call Forwarding', navigate: 'call-forwarding', template: 'callForwarding' },
    { id: 2, name: 'Ring Devices', navigate: 'devices', template: 'devices' },
    { id: 3, name: 'Inbound Call', navigate: 'inbound-call', template: 'inboundCall' },
    { id: 4, name: 'Outbound Call', navigate: 'outbound-call', template: 'outboundCall' }
  ];

  loading = true;
  profile: IdentityProfile;
  extension: Extension;
  me: Me;
  status = STATUS;
  AgentStatus = AgentStatus;
  currentStatus: {
    key: AgentStatus;
    value: string;
  };
  isDialogOpen: boolean;
  currentOrg: ProfileOrg;
  enabledLicenseOnly: boolean;
  appVersion: string;
  canSwitch: boolean;
  forwardList: string[];
  deviceList;
  sessionError$: Observable<string>;
  platforms: Platforms = {};

  @ViewChild('callForwarding') callForwarding: TemplateRef<any>;
  @ViewChild('devices') devices: TemplateRef<any>;
  @ViewChild('inboundCall') inboundCall: TemplateRef<any>;
  @ViewChild('outboundCall') outboundCall: TemplateRef<any>;

  constructor(
    private extensionQuery: ExtensionQuery,
    private router: Router,
    private meQuery: MeQuery,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private sessionService: SessionService,
    private sessionQuery: SessionQuery,
    private cdr: ChangeDetectorRef,
    public settingsService: SettingsService
  ) {
    super();
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    try {
      if (typeof webkit !== 'undefined' && webkit !== null) {
        this.platforms.webkit = webkit;
      }

      if (typeof Android !== 'undefined' && Android !== null) {
        this.platforms.Android = Android;
      }

      if (typeof CrossPlatformMobile !== 'undefined' && CrossPlatformMobile !== null) {
        this.platforms.CrossPlatformMobile = CrossPlatformMobile;
      }

      this.platforms.isWindows = false;
    } catch (e) {}

    this.sessionError$ = this.sessionService.error$;

    this.route.queryParams
      .pipe(
        filter(params => !!params),
        tap(({ enabledLicenseOnly, appVersion, darkMode, isWindows }) => {
          this.enabledLicenseOnly = enabledLicenseOnly ? enabledLicenseOnly === 'true' : false;
          this.appVersion = appVersion ?? '';
          this.platforms.isWindows = isWindows === 'true';
          this.settingsService.isWindows$.next(this.platforms.isWindows);

          if (this.enabledLicenseOnly && this.profile?.organizations?.length) {
            this.canSwitch = this.profile.organizations.filter(o => o.licenseEnabled).length > 1;
          } else {
            this.canSwitch = this.profile?.organizations?.length > 1;
          }

          this.changeTheme(darkMode === 'true');
        })
      )
      .subscribe();

    this.meQuery.me$
      .pipe(
        filter(me => !!me),
        tap(me => {
          this.me = me;
          this.currentStatus = this.status.find(s => s.key === this.me.status);
        })
      )
      .subscribe();

    combineLatest([
      this.sessionQuery.profile$,
      this.sessionQuery.currentOrg$,
      this.extensionQuery.selectActive(),
      this.meQuery.isPermission$
    ])
      .pipe(
        filter(([profile, org, _]) => !!profile && !!org),
        takeUntil(this.destroySubscriber$),
        tap(([profile, org, extension, permission]) => {
          if (permission === false) {
            this.me = null;
          }

          this.extension = extension ? new Extension(cloneDeep(extension)) : null;
          this.profile = cloneDeep(profile);
          this.currentOrg = org;

          if (this.extension) {
            this.forwardList = this.extension.cfConfig?.forwardList?.slice(0, 5);
            this.deviceList = this.extension.ringConfig?.activatedDevices?.slice(0, 5);
          }

          if (this.enabledLicenseOnly) {
            this.canSwitch = this.profile.organizations.filter(o => o.licenseEnabled).length > 1;
          } else {
            this.canSwitch = this.profile.organizations.length > 1;
          }
        }),
        tap(_ => {
          if (!this.loading) {
            return;
          }

          postMsgToFlutter(
            {
              action: 'loaded',
              status: 'success'
            },
            this.platforms
          );

          this.loading = false;
        })
      )
      .subscribe();
  }

  changeTheme(darkMode: boolean) {
    const bodyElement = document.body;

    if (bodyElement) {
      bodyElement.classList.remove(darkMode ? 'theme-default' : 'theme-dark');
      bodyElement.classList.add(darkMode ? 'theme-dark' : 'theme-default');
    }
  }

  close() {
    document.getElementsByClassName('animate__animated')[0].classList.remove('animate__slideInUp');
    document.getElementsByClassName('animate__animated')[0].classList.add('animate__slideOutDown');

    setTimeout(() => {
      this.dialog.closeAll();
    }, 500);
  }

  closeApp() {
    postMsgToFlutter(
      {
        action: 'close',
        status: 'success'
      },
      this.platforms
    );
  }

  navigate(path: string) {
    if (path === 'status') {
      this.isDialogOpen = true;
      this.dialog
        .open(SettingsStatusComponent, {
          hasBackdrop: false,
          panelClass: ['animate__animated', 'animate__slideInUp', 'status__dialog']
        })
        .afterClosed()
        .pipe(
          tap(_ => {
            this.isDialogOpen = false;
          })
        )
        .subscribe();
    } else if (path === 'inbound-call') {
      this.router.navigate(['setting', path]);
    } else {
      this.router.navigate(['setting', path]);
    }
  }

  switch() {
    const fromOrg = X.orgUuid;

    this.dialog
      .open(SettingsSwitchComponent, {
        maxWidth: '100vw',
        width: '100vw',
        height: '100vh',
        panelClass: 'switch__dialog'
      })
      .afterClosed()
      .subscribe(orgUuid => {
        postMsgToFlutter(
          {
            action: 'switchOrg',
            status: 'success',
            fromOrg,
            toOrg: orgUuid
          },
          this.platforms
        );
      });
  }
}
