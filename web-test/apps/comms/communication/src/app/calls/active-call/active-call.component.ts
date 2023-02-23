import { KeyValue } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { SupervisorSpyAction, Txn, TxnService, TxnType } from '@b3networks/api/callcenter';
import { GetReportV4Payload, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import { CommunicationAppSettings, PersonalSettingsQuery, PersonalSettingsService } from '@b3networks/api/portal';
import { ActiveIframeService, WindownActiveService } from '@b3networks/api/workspace';
import { APP_IDS, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { subHours } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { Observable, of, Subject, timer } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { ViewCallComponent } from './view-call/view-call.component';

@Component({
  selector: 'b3n-active-call',
  templateUrl: './active-call.component.html',
  styleUrls: ['./active-call.component.scss']
})
export class ActiveCallComponent implements OnInit, OnDestroy {
  readonly TxnType = TxnType;

  callLog: Txn[];
  userUtcOffset: string;
  timeFormat: string;
  fetching = true;

  settings$: Observable<CommunicationAppSettings>;

  displayedColumns: string[] = ['txnUuid', 'type', 'startAt', 'caller', 'to', 'state', 'queue', 'agent', 'action'];
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
    private activeIframeService: ActiveIframeService,
    private v4Service: V4Service
  ) {}

  ngOnDestroy(): void {
    this.destroyTimer$.next(true);
    this.destroyTimer$.complete();
  }

  ngOnInit() {
    this.settings$ = this.personalSettingQuery.appSettings$.pipe(
      map(apps => {
        const defaultRefreshTime = this.refreshes[0].key;
        let result = <CommunicationAppSettings>(
          apps.find(app => app.orgUuid === X.orgUuid && app.appId === APP_IDS.COMMUNICATION_HUB)
        );
        result = result || <CommunicationAppSettings>{ orgUuid: X.orgUuid, appId: APP_IDS.COMMUNICATION_HUB };
        result.activeCall = { ...result.activeCall, autoRefreshTime: defaultRefreshTime } || {
          autoRefreshTime: defaultRefreshTime
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

  filterChanged(settings: CommunicationAppSettings) {
    this.personalSettingService.updateAppSettings(settings).subscribe();
  }

  compareCodeFn(a: string, b: string) {
    return a && b && a === b;
  }

  pollingData(settings: CommunicationAppSettings) {
    this.fetching = true;
    this.destroyTimer$.next(true);

    timer(0, settings.activeCall.autoRefreshTime)
      .pipe(
        filter(() => this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe),
        takeUntil(this.destroyTimer$),
        switchMap(_ => {
          const req = {
            startTime: format(
              subHours(utcToZonedTime(new Date(), this.userUtcOffset), 12),
              "yyyy-MM-dd'T'HH:mm:ssxxx",
              {
                timeZone: this.userUtcOffset
              }
            ),
            endTime: format(utcToZonedTime(new Date(), this.userUtcOffset), "yyyy-MM-dd'T'HH:mm:ssxxx", {
              timeZone: this.userUtcOffset
            })
          } as GetReportV4Payload;

          return this.v4Service
            .getReportData(Period['dump'], ReportV4Code.communication.callLive, req, null, false)
            .pipe(
              finalize(() => {
                this.fetching = false;
              })
            );
        })
      )
      .subscribe(
        data => {
          if (data) {
            this.callLog = data.rows as Txn[];
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

  doAgentAction(call: Txn, action: KeyValue<SupervisorSpyAction, string>, settings: CommunicationAppSettings) {
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
