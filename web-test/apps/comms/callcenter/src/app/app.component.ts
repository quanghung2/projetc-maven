import { Component, NgZone, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IdentityProfileQuery, IdentityProfileService, ProfileOrg } from '@b3networks/api/auth';
import {
  Agent,
  AgentStatus,
  AGENT_NOT_FOUND_ERROR_CODE,
  Me,
  MeQuery,
  MeService,
  OrgConfig,
  OrgConfigQuery,
  PopupShowedOn,
  SubscriptionService as WSSubscriptionService,
  SystemStatusCode,
  TxnType
} from '@b3networks/api/callcenter';
import { PersonalSettingsService } from '@b3networks/api/portal';
import { ActiveIframeService, WindownActiveService } from '@b3networks/api/workspace';
import { APP_IDS, DestroySubscriberComponent } from '@b3networks/shared/common';
import { PushNotificationService } from '@b3networks/shared/notification';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, filter, finalize, map, mergeMap, retry, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { CallbackTxnComponent } from './workspace-shared/callback-txn/callback-txn.component';
import { InboundTxnComponent } from './workspace-shared/inbound-txn/inbound-txn.component';
import { ManualOutgoingTxnComponent } from './workspace-shared/manual-outgoing-txn/manual-outgoing-txn.component';
import { OutboundTxnComponent } from './workspace-shared/outbound-txn/outbound-txn.component';

class AgentNotification {
  agent: Agent;
  assignedTxn: string;
  at: number;
  status: AgentStatus;
  systemStatus: SystemStatusCode;
}

@Component({
  selector: 'b3n-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent extends DestroySubscriberComponent implements OnInit {
  private _isInactiveWindow = false;

  loading$: Observable<boolean>;
  me: Me;
  hasPermission: boolean;

  incommingDialogRef: MatDialogRef<InboundTxnComponent>;
  callbackDialogRef: MatDialogRef<CallbackTxnComponent>;
  outboundDialogRef: MatDialogRef<OutboundTxnComponent>;
  manualCallDialogRef: MatDialogRef<ManualOutgoingTxnComponent>;

  usingPushNotification: boolean;

  configApp: OrgConfig;
  org: ProfileOrg;

  isSuperAdminAndHasNoExtTypeCc: boolean;

  constructor(
    private meQuery: MeQuery,
    private meService: MeService,
    private profileQuery: IdentityProfileQuery,
    private profileService: IdentityProfileService,
    private orgConfigQuery: OrgConfigQuery,
    private personalSetting: PersonalSettingsService,
    private wbSubscription: WSSubscriptionService,
    private router: Router,
    private dialog: MatDialog,
    private spinnerService: LoadingSpinnerSerivce,
    private pushNotification: PushNotificationService,
    private toastService: ToastService,
    private activeIframeService: ActiveIframeService,
    private windownActiveService: WindownActiveService,
    private zone: NgZone
  ) {
    super();
    this.activeIframeService.initListenEvent(APP_IDS.WALLBOARD);
  }

  ngOnInit() {
    this.spinnerService.showSpinner();

    this.getOrgConfig();
    this.personalSetting.getPersonalSettings().subscribe();

    this.meQuery.me$.pipe(takeUntil(this.destroySubscriber$)).subscribe(me => {
      this.handleMe(me);
    });

    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        take(1)
      )
      .subscribe(_ => {
        this.meService.get().subscribe(
          () => {},
          __ => (this.hasPermission = false)
        );
      });

    forkJoin([
      this.wbSubscription.getSubscription().pipe(
        catchError(error => {
          this.hasPermission = false;
          throw error;
        })
      ),
      this.profileService.getProfile()
    ])
      .pipe(
        finalize(() => {
          this.spinnerService.hideSpinner();
        }),
        mergeMap(([wbSubscription, _]) => {
          if (!wbSubscription.hasLicence) {
            throw { code: 'noPermission', message: 'No permission' };
          }

          return this.pushNotification.initializeFirebase(environment.appId).pipe(
            catchError(err => {
              console.error('_err firebase: ', err);
              return of(false);
            })
          );
        })
      )
      .subscribe(
        inited => {
          this.usingPushNotification = inited;

          if (this.usingPushNotification) {
            this.pushNotification.message$
              .pipe(
                tap(msg => console.log(msg)),
                takeUntil(this.destroySubscriber$),
                map(message => Object.assign(new AgentNotification(), JSON.parse(message.data.notificationData))),
                tap(msg => console.log(msg)),
                switchMap(_ => {
                  return this.isSuperAdminAndHasNoExtTypeCc
                    ? this.meQuery.me$
                    : this.meService.get().pipe(
                        retry(3),
                        catchError(__ => of(null))
                      );
                })
              )
              .subscribe(_ => {
                if (!this.isSuperAdminAndHasNoExtTypeCc) {
                  this.zone.run(() => {
                    //https://github.com/NativeScript/nativescript-angular/issues/1014#issuecomment-418806098
                    this.meService
                      .get()
                      .pipe(
                        retry(3),
                        catchError(__ => of(null))
                      )
                      .subscribe();
                  });
                }
              });
          } else {
            console.error('This app will not work well as user disabled push notification');
          }
        },
        error => {
          if (error.code === AGENT_NOT_FOUND_ERROR_CODE) {
            this.hasPermission = false;
          } else {
            this.toastService.error(error.message);
          }
        }
      );

    this.windownActiveService.windowActiveStatus$.pipe(takeUntil(this.destroySubscriber$)).subscribe(status => {
      if (this._isInactiveWindow && status) {
        this.zone.run(() => {
          this.meService.get().subscribe();
        });
      }
      this._isInactiveWindow = !status;
    });
  }

  private handleMe(me: Me) {
    if (!me || !(me instanceof Me) || (this.me && this.me.extKey && !me.extKey)) {
      return;
    }

    if (!this.me || (!me.extKey && !!this.me.extKey) || (!!me.extKey && !this.me.extKey)) {
      // first time go this app or has been assign|remove agent
      // wating for header generate links
      setTimeout(() => {
        if (this.me && !!this.me.extKey) {
          this.hasPermission = true;
          setTimeout(() => {
            if (environment.production) {
              this.router.navigate(['workspace']);
            }
          }, 0);
        } else if (this.me) {
          this.hasPermission = false;
        }
      }, 0);
    }

    this.me = me;
    if (this.me.extKey) {
      this.hasPermission = true;
    } else {
      this.hasPermission = false;
    }

    if (this.me && (this.me.popupShowedOn === PopupShowedOn.app || this.me.popupShowedOn === PopupShowedOn.none)) {
      // do nothing
    } else {
      this.notifyIfNeeded();
    }
  }

  private notifyIfNeeded() {
    if (this.me.assignedTxn) {
      // check popup type in setting
      if (this.configApp.popupConfig && this.configApp.popupConfig.canShowPopup(this.me?.assignedTxn)) {
        switch (this.me.assignedTxn.type) {
          case TxnType.incoming:
            if (this.me.assignedTxn.shouldPopupAcwPopup) {
              this.notifyIncomming();
            }
            break;

          case TxnType.callback:
            this.notifyCallback();
            break;
          case TxnType.autodialer:
            this.notifyAutodialer();
            break;
          case TxnType.crossApp:
          case TxnType.crossAppIn:
          case TxnType.incoming2extension:
          case TxnType.outgoing:
          case TxnType.internal:
          case TxnType.outgoingFromSipGateway:
            this.notifyManualCaller();
            break;
        }
      }
    } else {
      if (this.incommingDialogRef && this.incommingDialogRef.componentInstance) {
        this.incommingDialogRef.close();
      }
      if (this.callbackDialogRef && this.callbackDialogRef.componentInstance) {
        this.callbackDialogRef.close();
      }
      if (this.outboundDialogRef && this.outboundDialogRef.componentInstance) {
        this.outboundDialogRef.close();
      }
      if (this.manualCallDialogRef && this.manualCallDialogRef.componentInstance) {
        this.manualCallDialogRef.close();
      }
    }
  }

  private notifyIncomming() {
    if (!this.incommingDialogRef || !this.incommingDialogRef.componentInstance) {
      console.log(`open new inbound txn component with assigned txn`, this.me.assignedTxn);

      this.incommingDialogRef = this.dialog.open(InboundTxnComponent, {
        data: {
          defaultWrapUpTime: this.configApp.defaultWrapUpTimeInSeconds,
          me: this.me
        },
        minWidth: '460px',
        disableClose: true
      });
    } else {
      console.log(`reset me info`);

      this.incommingDialogRef.componentInstance.me = this.me;
    }
  }

  private notifyCallback() {
    if (!this.callbackDialogRef || !this.callbackDialogRef.componentInstance) {
      this.callbackDialogRef = this.dialog.open(CallbackTxnComponent, {
        data: this.me,
        minWidth: '460px',
        disableClose: true
      });
    } else {
      this.callbackDialogRef.componentInstance.me = this.me;
    }
  }

  private notifyAutodialer() {
    if (!this.outboundDialogRef || !this.outboundDialogRef.componentInstance) {
      this.outboundDialogRef = this.dialog.open(OutboundTxnComponent, {
        data: this.me,
        minWidth: '460px',
        disableClose: true
      });
    } else {
      this.outboundDialogRef.componentInstance.me = this.me;
    }
  }

  private notifyManualCaller() {
    if (!this.manualCallDialogRef || !this.manualCallDialogRef.componentInstance) {
      this.manualCallDialogRef = this.dialog.open(ManualOutgoingTxnComponent, {
        data: {
          me: this.me
        },
        minWidth: '460px',
        disableClose: true
      });
    } else {
      this.manualCallDialogRef.componentInstance.me = this.me;
    }
  }

  private getOrgConfig() {
    this.orgConfigQuery.orgConfig$.pipe(takeUntil(this.destroySubscriber$)).subscribe(config => {
      this.configApp = config;
    });
  }
}
