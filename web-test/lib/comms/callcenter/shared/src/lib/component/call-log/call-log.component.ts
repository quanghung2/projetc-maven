import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import {
  Agent,
  AgentService,
  CallLogResult,
  FindAgentsReq,
  LicenceType,
  Me,
  MeQuery,
  QueueInfo,
  QueueService,
  TxnType
} from '@b3networks/api/callcenter';
import { Pageable } from '@b3networks/api/common';
import { CallLogTxnV4, GetReportV4Payload, Period, ReportV4Code, StateService, V4Service } from '@b3networks/api/data';
import {
  CallcenterAppSettings,
  CallcenterCallFeature,
  CallcenterCallLogSetting,
  PersonalSettingsQuery,
  PersonalSettingsService
} from '@b3networks/api/portal';
import {
  APP_IDS,
  DestroySubscriberComponent,
  downloadData,
  getFilenameFromHeader,
  TimeRangeHelper,
  TimeRangeKey,
  X
} from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { addDays, startOfDay } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { forkJoin, Observable } from 'rxjs';
import { filter, finalize, map, takeUntil, tap } from 'rxjs/operators';
import { UpdateNoteComponent } from './update-note/update-note.component';

export enum CallLogPageType {
  answered = 'answered',
  unanswered = 'unanswered'
}

const Inbound_Txn_Types = [TxnType.incoming, TxnType.callback, TxnType.overflow];

@Component({
  selector: 'b3n-call-log',
  templateUrl: './call-log.component.html',
  styleUrls: ['./call-log.component.scss']
})
export class CallLogComponent extends DestroySubscriberComponent implements OnInit {
  readonly CallLogPageType = CallLogPageType;
  readonly TxnType = TxnType;
  readonly CallLogTxnV4 = null;

  pageable = <Pageable>{ page: 1, perPage: 10 };
  logPageType: CallLogPageType;

  logs: MatTableDataSource<CallLogTxnV4>;
  hasMore: boolean;

  me: Me;
  agents: Agent[] = [];
  queues: QueueInfo[] = [];
  timeFormat: string;
  timezone: string;

  displayedColumns: string[] = [];
  isMore: boolean;

  pageFiltering: CallcenterCallLogSetting;
  settings$: Observable<CallcenterAppSettings>;

  loading = true;

  isAppSetting = false;

  get reportV4Code(): string {
    return this.pageFiltering.callType === TxnType.incoming
      ? ReportV4Code.callcenter.inbound
      : this.pageFiltering.callType === TxnType.autodialer
      ? ReportV4Code.callcenter.autodialer
      : this.pageFiltering.callType === TxnType.overflow
      ? ReportV4Code.callcenter.inbound
      : ReportV4Code.callcenter.callback;
  }

  constructor(
    private profileQuery: IdentityProfileQuery,
    private agentService: AgentService,
    private queueService: QueueService,
    private stateService: StateService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private meQuery: MeQuery,
    private activatedRoute: ActivatedRoute,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private v4Service: V4Service,
    private router: Router
  ) {
    super();
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          const prefix = event.url.match(/\w+(?=\/workspace)/);

          if (prefix) {
            this.isAppSetting = true;
          }
        }
      });
  }

  ngOnInit() {
    this.loading = true;
    this.activatedRoute.url.subscribe(
      url => {
        this.logPageType = url[0].path === 'answered-calls' ? CallLogPageType.answered : CallLogPageType.unanswered;

        forkJoin(
          [
            this.agentService.findAgents(new FindAgentsReq()), //2
            this.queueService.loadQueueList(),
            this.stateService.fetchQueueAssignedAgents()
          ] //4
        )
          .pipe(
            finalize(() => {
              this.loading = false;
            })
          )
          .subscribe(([agents, queues, assignedQueues]) => {
            const org = this.profileQuery.currentOrg;
            const me = this.meQuery.getMe();
            if (!me) {
              return;
            }

            this.timeFormat = org.timeFormat;
            this.timezone = org.utcOffset;
            this.me = me;
            this.agents = agents;
            this.queues = queues;

            if (!this.me.isSupervisor) {
              this.queues = assignedQueues
                .filter(item => item.agents.includes(this.me.identityUuid))
                .map(
                  queue =>
                    new QueueInfo({
                      uuid: queue.uuid,
                      name: queue.name
                    })
                );
            }

            this.settings$ = this.personalSettingQuery.appSettings$.pipe(
              map(apps => {
                let result = <CallcenterAppSettings>(
                  apps.find(app => app.orgUuid === X.orgUuid && app.appId === APP_IDS.WALLBOARD)
                );
                result = result || <CallcenterAppSettings>{ orgUuid: X.orgUuid, appId: APP_IDS.WALLBOARD };

                if (this.logPageType === CallLogPageType.answered) {
                  result.workspaceAnsweredCall =
                    result.workspaceAnsweredCall ||
                    <CallcenterCallLogSetting>{
                      callType: TxnType.incoming,
                      timeRange: 'today',
                      filterBy: 'txnUuid'
                    };
                  this.pageFiltering = result.workspaceAnsweredCall;
                } else {
                  result.workspaceUnansweredCall =
                    result.workspaceUnansweredCall ||
                    <CallcenterCallLogSetting>{
                      callType: TxnType.incoming,
                      timeRange: 'today',
                      filterBy: 'txnUuid'
                    };
                  this.pageFiltering = result.workspaceUnansweredCall;
                }

                if (this.isAppSetting) {
                  result.callFeature = CallcenterCallFeature.inbound;
                }

                if (result.callFeature === CallcenterCallFeature.inbound) {
                  if (Inbound_Txn_Types.indexOf(<TxnType>this.pageFiltering.callType) === -1) {
                    this.pageFiltering.callType = TxnType.incoming;
                  }
                } else {
                  this.pageFiltering.callType = TxnType.autodialer;
                }

                return result;
              }),
              tap(_ => {
                this.fetchDataV4();
              })
            );
          });
      },
      _ => {
        this.loading = false;
        this.toastService.error('High trafic. Please try againt later');
      }
    );
  }

  viewCall(call: CallLogTxnV4) {
    if (this.logPageType === CallLogPageType.answered) {
      this.dialog.open(UpdateNoteComponent, {
        minWidth: '50vw',
        data: call
      });
    }
  }

  onFilterChanged(settings: CallcenterAppSettings) {
    this.loading = true;
    this.pageable.page = 1;
    if (this.logPageType === CallLogPageType.answered) {
      settings.workspaceAnsweredCall = this.pageFiltering;
    } else {
      settings.workspaceUnansweredCall = this.pageFiltering;
    }
    this.personalSettingService.updateAppSettings(settings).subscribe(res => (this.loading = false));
  }

  export() {
    this.loading = true;
    const req = this.buildSearchReqV4();
    const code =
      this.pageFiltering.callType === TxnType.incoming
        ? ReportV4Code.callcenter.inbound
        : this.pageFiltering.callType === TxnType.autodialer
        ? ReportV4Code.callcenter.autodialer
        : this.pageFiltering.callType === TxnType.overflow
        ? ReportV4Code.callcenter.overflow
        : ReportV4Code.callcenter.callback;

    this.v4Service
      .downloadReport2(Period.dump, code, req, {
        orgUuid: X.orgUuid,
        sessionToken: X.sessionToken
      })
      .pipe(
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe(
        response => {
          downloadData(
            new Blob([response.body], { type: 'text/csv;charset=utf-8;' }),
            getFilenameFromHeader(response.headers)
          );
        },
        error => {
          this.toastService.error(error.message || 'Cannot download report. Please try again later.');
        }
      );
  }

  onChangePage(page?: number) {
    if (page > -1) {
      this.pageable.page = page;
    }
    this.fetchDataV4();
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  copyFailed() {
    this.toastService.error('Copy failed');
  }

  private fetchDataV4() {
    const req = this.buildSearchReqV4();
    const code = this.reportV4Code + '.inapp';

    forkJoin([
      this.v4Service
        .getReportData<CallLogTxnV4>(Period.dump, code, req, this.pageable, false)
        .pipe(map(resp => resp.rows.map(x => new CallLogTxnV4(x)))),
      this.v4Service
        .getReportData(
          Period.dump,
          code,
          req,
          {
            page: this.pageable.page + 1,
            perPage: this.pageable.perPage
          },
          false
        )
        .pipe(map(resp => resp.rows.map(x => new CallLogTxnV4(x))))
    ])
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
        map((data: Array<CallLogTxnV4[]>) => data.map(item => item.map(x => new CallLogTxnV4(x))))
      )
      .subscribe(
        data => {
          this.buildColumns();
          this.logs = new MatTableDataSource(data[0]);
          this.isMore = data[1].length > 0;
        },
        err => {
          if (err.code === 'data.notFound') {
            this.logs = new MatTableDataSource([]);
            this.hasMore = false;
          } else {
            this.toastService.error(err.message);
          }
        }
      );
  }

  private buildSearchReqV4(): GetReportV4Payload {
    const timeRange = TimeRangeHelper.buildTimeRangeFromKey(this.pageFiltering.timeRange, this.timezone);

    if (this.pageFiltering.timeRange === TimeRangeKey.specific_date) {
      timeRange.startDate = format(
        startOfDay(
          utcToZonedTime(
            this.pageFiltering.startDate ? new Date(this.pageFiltering.startDate) : new Date(),
            this.timezone
          )
        ),
        "yyyy-MM-dd'T'HH:mm:ssxxx",
        {
          timeZone: this.timezone
        }
      );
      timeRange.endDate = format(
        addDays(
          startOfDay(
            utcToZonedTime(
              this.pageFiltering.endDate ? new Date(this.pageFiltering.endDate) : new Date(),
              this.timezone
            )
          ),
          1
        ),
        "yyyy-MM-dd'T'HH:mm:ssxxx",
        {
          timeZone: this.timezone
        }
      );
    }

    const req = <Partial<GetReportV4Payload>>{
      startTime: timeRange.startDate,
      endTime: timeRange.endDate,
      filter: {}
    };

    if (this.logPageType === CallLogPageType.answered) {
      req.filter = {};
      req.filter.result = [CallLogResult.answered];
    } else {
      if (this.pageFiltering.callType === TxnType.incoming) {
        req.filter.result2 = [CallLogResult.abandoned, CallLogResult.voicemail];
      } else if (this.pageFiltering.callType === TxnType.overflow) {
        req.filter.result2 = [CallLogResult.overflow];
      } else {
        req.filter.result = [CallLogResult.unanswered];
      }
    }

    if (this.pageFiltering.fromNumber) {
      req.filter.callerId = this.pageFiltering.fromNumber.trim();
    }
    if (this.pageFiltering.toNumber) {
      switch (this.pageFiltering.callType) {
        case TxnType.autodialer:
          req.filter.destinationNumber = this.pageFiltering.toNumber.trim();
          break;
        case TxnType.callback:
          req.filter.contactNumber = this.pageFiltering.toNumber.trim();
          break;
        default:
          req.filter.incomingNumber = this.pageFiltering.toNumber.trim();
      }
    }
    if (this.pageFiltering.txnUuid) {
      req.filter.txnUuid = this.pageFiltering.txnUuid.trim();
    }

    if (this.meQuery.getLicense() === LicenceType.agent) {
      req.filter.agentUuid = this.meQuery.getMe().identityUuid;
    }

    return <GetReportV4Payload>req;
  }

  private buildColumns() {
    if (this.logPageType === CallLogPageType.answered) {
      if (this.pageFiltering.callType === TxnType.callback) {
        this.displayedColumns = ['txn-uuid', 'from', 'to', 'at', 'queue', 'agent', 'disposition-code', 'note'];
      } else {
        this.displayedColumns = [
          'txn-uuid',
          'from',
          'to',
          'at',
          'queue',
          'agent',
          'status',
          'disposition-code',
          'note'
        ];
      }
    } else {
      if (this.pageFiltering.callType === TxnType.callback) {
        this.displayedColumns = ['txn-uuid', 'from', 'to', 'at', 'queue'];
      } else if (this.pageFiltering.callType === TxnType.overflow) {
        this.displayedColumns = ['txn-uuid', 'from', 'at', 'queue', 'customer-action'];
      } else {
        this.displayedColumns = ['txn-uuid', 'from', 'to', 'at', 'queue', 'status'];
      }
    }
  }
}
