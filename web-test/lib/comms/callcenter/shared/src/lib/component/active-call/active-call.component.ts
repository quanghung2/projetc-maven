import { KeyValue } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { SupervisorSpyAction, Txn, TxnService, TxnType } from '@b3networks/api/callcenter';
import {
  CallcenterAppSettings,
  CallcenterCallFeature,
  PersonalSettingsQuery,
  PersonalSettingsService
} from '@b3networks/api/portal';
import { ActiveIframeService, WindownActiveService } from '@b3networks/api/workspace';
import { APP_IDS, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable, of, Subject, timer } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, take, tap } from 'rxjs/operators';
import { ViewCallComponent } from './view-call/view-call.component';

@Component({
  selector: 'b3n-active-call',
  templateUrl: './active-call.component.html',
  styleUrls: ['./active-call.component.scss']
})
export class ActiveCallComponent implements OnInit, OnDestroy {
  callLog: Txn[];
  userUtcOffset: string;
  timeFormat: string;
  fetching = true;

  settings$: Observable<CallcenterAppSettings>;

  displayedColumns: string[] = [
    'txn-uuid',
    'from',
    'to',
    'type',
    'status',
    'start-at',
    'talking-at',
    'queue',
    'agent',
    'action'
  ];
  takeActions: KeyValue<SupervisorSpyAction, string>[] = [
    { key: SupervisorSpyAction.barge, value: 'barge' },
    { key: SupervisorSpyAction.spy, value: 'monitor' },
    { key: SupervisorSpyAction.whisper, value: 'whisper' }
  ];
  forceHangup: KeyValue<SupervisorSpyAction, string> = { key: SupervisorSpyAction.forceHangup, value: 'force hangup' };

  private destroyTimer$ = new Subject();

  readonly refreshes: KeyValue<number, string>[] = [
    { key: 10 * 1000, value: 'Every 10 seconds' },
    { key: 30 * 1000, value: 'Every 30 seconds' },
    { key: 60 * 1000, value: 'Every 1 minute' },
    { key: 5 * 60 * 1000, value: 'Every 5 minutes' }
  ];

  constructor(
    private profileQuery: IdentityProfileQuery,
    private txnService: TxnService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService
  ) {}

  ngOnDestroy(): void {
    this.destroyTimer$.next(true);
    this.destroyTimer$.complete();
  }

  ngOnInit() {
    this.settings$ = this.personalSettingQuery.appSettings$.pipe(
      map(apps => {
        let result = <CallcenterAppSettings>(
          apps.find(app => app.orgUuid === X.orgUuid && app.appId === APP_IDS.WALLBOARD)
        );
        result = result || <CallcenterAppSettings>{ orgUuid: X.orgUuid, appId: APP_IDS.WALLBOARD };
        result.workspaceActiveCall = result.workspaceActiveCall || {
          autoRefreshTime: this.refreshes[3].key
        };
        return result;
      }),
      tap(settings => {
        this.pollingData(settings);
      })
    );

    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        take(1)
      )
      .subscribe(org => {
        this.userUtcOffset = org.utcOffset;
        this.timeFormat = org.timeFormat;
      });
  }

  filterChanged(settings: CallcenterAppSettings) {
    this.personalSettingService.updateAppSettings(settings).subscribe();
  }

  compareCodeFn(a: string, b: string) {
    return a && b && a === b;
  }

  pollingData(settings: CallcenterAppSettings) {
    this.destroyTimer$.next(true);

    timer(0, settings.workspaceActiveCall.autoRefreshTime)
      .pipe(
        filter(() => this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe),
        switchMap(_ => {
          this.fetching = true;
          if (settings.callFeature === CallcenterCallFeature.outbound) {
            return this.txnService
              .fetchActiveTxns([TxnType.autodialer, TxnType.incoming2extension, TxnType.outgoing, TxnType.internal])
              .pipe(
                finalize(() => {
                  this.fetching = false;
                })
              );
          } else {
            return this.txnService.fetchActiveTxns([TxnType.incoming, TxnType.callback]).pipe(
              finalize(() => {
                this.fetching = false;
              })
            );
          }
        })
      )
      .subscribe(
        data => {
          if (data) {
            this.callLog = data;
          }
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  viewCall(call: Txn) {
    this.dialog.open(ViewCallComponent, {
      minHeight: '60vh',
      minWidth: '60vw',
      data: call
    });
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  doAgentAction(call: Txn, action: KeyValue<SupervisorSpyAction, string>, settings: CallcenterAppSettings) {
    let msg = '';
    if (action.key === SupervisorSpyAction.forceHangup) {
      msg = 'Hung up call successfully';
    } else {
      msg = `A call will be made to your phone to ${action.value} this agent`;
    }

    this.txnService
      .takeAction(call.txnUuid, action.key)
      .pipe(
        catchError(error => {
          this.toastService.error(error.message);
          return of();
        })
      )
      .subscribe(
        _ => {
          this.pollingData(settings);
          this.toastService.success(msg);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
