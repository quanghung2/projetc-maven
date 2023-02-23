import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IdentityProfile, IdentityProfileQuery } from '@b3networks/api/auth';
import {
  AudioPlayerService,
  AudioWebRTC,
  CallManagement,
  KEY_CACHE_CREDENTIAL_ACCOUNT,
  SessionDirection,
  TypeSound,
  WebrtcQuery,
  WebrtcService
} from '@b3networks/api/call';
import { AgentStatus, ExtensionQuery, Me, MeQuery, MeService } from '@b3networks/api/callcenter';
import { MeQuery as LicenseMeQuery } from '@b3networks/api/license';
import { PersonalSettingsQuery, PersonalSettingsService, UnifiedWorkspaceSetting } from '@b3networks/api/portal';
import { MeQuery as WorkspaceMeQuery } from '@b3networks/api/workspace';
import {
  AppQuery,
  AppService,
  KeypadComponent,
  ManagePhoneDialogComponent,
  ModeSidebar,
  PhoneDialogComponent
} from '@b3networks/chat/shared/core';
import { BusyNoteComponent } from '@b3networks/comms/callcenter/shared';
import { APP_IDS, DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { RTCSession } from 'jssip/lib/RTCSession';
import { Observable, of } from 'rxjs';
import { filter, take, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-app-status',
  templateUrl: './app-status.component.html',
  styleUrls: ['./app-status.component.scss']
})
export class AppStatusComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild('remoteAudio') remoteAudio: ElementRef;
  @ViewChild('phoneAction') phoneAction: ElementRef;

  @Input() hasTeamChatLicense: boolean;

  readonly AgentStatus = AgentStatus;
  readonly SessionDirection = SessionDirection;

  me$: Observable<Me>;
  profile$: Observable<IdentityProfile>;
  session$: Observable<RTCSession>;
  notMicrosoftTeamLicense$: Observable<boolean>;
  hasPhoneFeature$: Observable<boolean>;
  isZoom: boolean;
  call: CallManagement;
  displayMemberStr: string;

  constructor(
    private meQuery: MeQuery,
    private meService: MeService,
    private identityProfileQuery: IdentityProfileQuery,
    private webrtcQuery: WebrtcQuery,
    private webrtcService: WebrtcService,
    private audioPlayerService: AudioPlayerService,
    private toastr: ToastService,
    private dialog: MatDialog,
    private licenseMeQuery: LicenseMeQuery,
    private workspaceMeQuery: WorkspaceMeQuery,
    private router: Router,
    private extensionQuery: ExtensionQuery,
    private appService: AppService,
    private appQuery: AppQuery,
    private personalSettingsQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService
  ) {
    super();
  }

  switchOrg() {
    const mode = this.appQuery.getValue()?.modeRightSidebar;

    if (mode === ModeSidebar.side) {
      const settings = <UnifiedWorkspaceSetting>(
        this.personalSettingsQuery.getAppSettings(X.orgUuid, APP_IDS.UNIFIED_WORKSPACE)
      );
      settings.showRightSidebar = false;
      this.personalSettingService.updateAppSettings(settings).subscribe();
    } else if (mode === ModeSidebar.over) {
      this.appService.update({
        showRightSidebar: false
      });
    }

    this.router.navigate(['switch-org']);
  }

  ngOnInit() {
    this._importFileAudios();
    this.me$ = this.meQuery.me$.pipe(filter(me => me != null));
    this.session$ = this.webrtcQuery.session$.pipe(
      tap(session => {
        if (session) {
          this.openManagePhoneDialog();
        }
      })
    );

    this.profile$ = this.identityProfileQuery.profile$;
    this.hasPhoneFeature$ = this.licenseMeQuery.hasDeviceWebRTCLicense$;

    this.webrtcQuery.callManagement$.pipe(takeUntil(this.destroySubscriber$)).subscribe(call => {
      if (call) {
        this.call = call;
        this.isZoom = call.isZoom;
      }
    });

    this.webrtcQuery.session$.pipe(takeUntil(this.destroySubscriber$)).subscribe();

    // start WebRTC
    this.licenseMeQuery.hasDeviceWebRTCLicense$
      .pipe(
        filter(hasDeviceWebRTCLicense => hasDeviceWebRTCLicense),
        takeUntil(this.destroySubscriber$),
        take(1)
      )
      .subscribe(_ => {
        this.handleWebrtcCalls();
        this.workspaceMeQuery.me$
          .pipe(
            filter(x => x != null),
            takeUntil(this.destroySubscriber$),
            take(1)
          )
          .subscribe(me => {
            this.webrtcService.init(`${KEY_CACHE_CREDENTIAL_ACCOUNT}_${X.orgUuid}_i${me?.identityUuid}`).subscribe();
          });
      });

    this.notMicrosoftTeamLicense$ = this.licenseMeQuery.notMicrosoftTeamLicense$;
  }

  private getDisplayMember(call: CallManagement): Observable<string> {
    if (call.isRemote) {
      const remoteExtIdentity = this.webrtcQuery?.session?.remote_identity?.display_name;
      if (remoteExtIdentity) {
        if (remoteExtIdentity.length > 8) {
          // phone
          return of(remoteExtIdentity);
        } else {
          // ext
          return this.extensionQuery.selectEntity(remoteExtIdentity, 'displayText');
        }
      }
    } else {
      let displayName = call?.member?.displayName;
      if (displayName) {
        const ext = this.extensionQuery.getExtensionByKey(call?.member?.displayName.replace('+', ''));
        if (ext) {
          displayName = `${ext.extLabel} (#${ext.extKey})`;
        }
      }
      return of(displayName);
    }
    return of(null);
  }

  changeStatus(status: AgentStatus) {
    switch (status) {
      case AgentStatus.available:
        this.login();
        break;
      case AgentStatus.busy:
        this.busy();
        break;
      case AgentStatus.offline:
        this.logout();
        break;
      case AgentStatus.dnd:
        this.selectDND();
        break;
    }
  }

  ended() {
    this.webrtcService.doRejectCall();
    this.dialog.closeAll();
  }

  accept() {
    this.webrtcService.doAnswerIncoming();
  }

  toggleHold() {
    this.webrtcService.doToggleHold();
  }

  dialpad() {
    this.dialog.open(KeypadComponent, {
      width: '320px',
      data: {
        isDTMF: true
      }
    });
  }

  openPhoneDialog() {
    if (this.isZoom) {
      this.openManagePhoneDialog();
    } else {
      this.dialog.open(PhoneDialogComponent, {
        data: {},
        width: '340px',
        panelClass: 'manage-call'
      });
    }
  }

  private openManagePhoneDialog() {
    this.webrtcService.doZoom(false);
    this.dialog.open(ManagePhoneDialogComponent, {
      data: {},
      width: '350px',
      height: '600px',
      panelClass: 'manage-call'
    });
  }

  private handleWebrtcCalls() {
    this.webrtcQuery.statusUA$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(data => data != null),
        tap(({ status, reason }) => {
          console.log('status WebRTC: ', status);
          if (reason) {
            if (reason !== 'Canceled') {
              this.toastr.error(reason);
            }
          }
        })
      )
      .subscribe();

    this.webrtcQuery.session$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(session => !!session)
      )
      .subscribe(session => {
        if (session.connection) {
          session.connection.addEventListener('addstream', (event: any) => {
            console.log('event: session.connection', event);
            this._handleRemoteStream(event.stream);
          });
        }

        session.on('peerconnection', data => {
          data.peerconnection.addEventListener('addstream', (event: any) => {
            console.log('event: peerconnection ', event);
            this._handleRemoteStream(event.stream);
          });
        });
      });
  }

  private _handleRemoteStream(stream) {
    const remoteAudio = this.remoteAudio.nativeElement;
    // Display remote stream
    remoteAudio.srcObject = stream;

    stream.addEventListener('addtrack', _ => {
      if (remoteAudio.srcObject !== stream) {
        return;
      }
      // Refresh remote audio
      remoteAudio.srcObject = stream;
    });

    stream.addEventListener('removetrack', () => {
      if (remoteAudio.srcObject !== stream) {
        return;
      }
      // Refresh remote audio
      remoteAudio.srcObject = stream;
    });
  }

  private _importFileAudios() {
    const files = [
      <AudioWebRTC>{
        name: TypeSound.ringback,
        audio: new Audio('assets/sound/ringback.wav')
      },
      <AudioWebRTC>{
        name: TypeSound.ringing,
        audio: new Audio('assets/sound/ringback.wav')
      },
      <AudioWebRTC>{
        name: TypeSound.rejected,
        audio: new Audio('assets/sound/ended.mp3')
      },
      <AudioWebRTC>{
        name: TypeSound.answered,
        audio: new Audio('assets/sound/answered.mp3')
      },
      <AudioWebRTC>{
        name: TypeSound.hold,
        audio: new Audio('assets/sound/ringing.mp3')
      },
      <AudioWebRTC>{
        name: TypeSound.dial,
        audio: new Audio('assets/sound/dial.mp3')
      }
    ];

    this.audioPlayerService.importFileAudios(files);
  }

  private login() {
    this.meService.login(null).subscribe(
      _ => {
        this.toastr.success('Change status to available successfully');
      },
      err => {
        this.toastr.error(err.message);
      }
    );
  }

  private selectDND() {
    this.meService.dnd().subscribe(
      _ => {
        this.toastr.success('Change status to offline successfully');
      },
      err => {
        this.toastr.error(err.message);
      }
    );
  }

  private logout() {
    this.meService.logout().subscribe(
      _ => {
        this.toastr.success('Change status to offline successfully');
      },
      err => {
        this.toastr.error(err.message);
      }
    );
  }

  private busy() {
    this.dialog
      .open(BusyNoteComponent, {})
      .afterClosed()
      .subscribe(result => {
        if (result && result.reason) {
          this.meService.makeBusy(result.reason).subscribe(
            _ => {
              this.toastr.success('Change status to busy successfully');
            },
            err => {
              this.toastr.error(err.message);
            }
          );
        }
      });
  }
}
