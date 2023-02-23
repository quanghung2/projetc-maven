import { PercentPipe, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { AgentService, FindAgentsReq, QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { GetReportV4Payload, InboundDashboard, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import {
  CallcenterAppSettings,
  CallcenterDashboardSetting,
  PersonalSettingsQuery,
  PersonalSettingsService
} from '@b3networks/api/portal';
import { ActiveIframeService, WindownActiveService } from '@b3networks/api/workspace';
import { downloadData, TimeRangeHelper, TimeRangeKey, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { addDays, set, startOfDay } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { Observable, Subject, timer } from 'rxjs';
import { filter, finalize, map, share, take, takeUntil, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AbandonedRateComponent } from './abandoned-rate/abandoned-rate.component';
import { AgentStatisticComponent } from './agent-statistic/agent-statistic.component';
import { AgentStatusComponent } from './agent-status/agent-status.component';
import { AverageCallDurationComponent } from './average-call-duration/average-call-duration.component';
import { AverageWaitTimeComponent } from './average-wait-time/average-wait-time.component';
import { CallStatisticComponent } from './call-statistic/call-statistic.component';
import { CurrentCallsInQueueComponent } from './current-calls-in-queue/current-calls-in-queue.component';
import { LongestWaitTimeComponent } from './longest-wait-time/longest-wait-time.component';
import { SlaComponent } from './sla/sla.component';

export class DashboardCsv {
  QueueUuid: string;
  'Queue Name': string;
  From: string;
  To: string;
  Interval: string;
  'Date Time': string;
  OnDestroy;
  'Total Inbounds' = 0;
  'Abandoned Calls' = 0;
  'Calls answered in 20s' = 0;
  'Answered Calls' = 0;
  SLA = '0.00%';
  'Average Talk Time' = '00:00:00';
  'Longest Waiting Time' = '00:00:00';

  constructor(obj?: any) {
    Object.assign(this, obj);
  }
}

@Component({
  selector: 'b3n-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  queues: QueueInfo[];
  userUtcOffset: string;
  loading: boolean;

  settings$: Observable<CallcenterAppSettings>;

  @ViewChild(AgentStatisticComponent)
  agentStatisticComponent: AgentStatisticComponent;
  @ViewChild(AgentStatusComponent)
  agentListComponent: AgentStatusComponent;
  @ViewChild(CallStatisticComponent)
  callStatisticComponent: CallStatisticComponent;
  @ViewChild(AbandonedRateComponent)
  abandonedRateComponent: AbandonedRateComponent;
  @ViewChild(SlaComponent)
  slaComponent: SlaComponent;
  @ViewChild(CurrentCallsInQueueComponent)
  currentCallsInQueueComponent: CurrentCallsInQueueComponent;
  @ViewChild(LongestWaitTimeComponent)
  longestWaitTimeComponent: LongestWaitTimeComponent;
  @ViewChild(AverageCallDurationComponent)
  averageCallDurationComponent: AverageCallDurationComponent;
  @ViewChild(AverageWaitTimeComponent)
  averageWaitTimeComponent: AverageWaitTimeComponent;

  private destroyTimer$ = new Subject();

  constructor(
    private toastService: ToastService,
    private agentService: AgentService,
    private queueService: QueueService,
    private profileQuery: IdentityProfileQuery,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private v4Service: V4Service,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService
  ) {}

  ngOnInit() {
    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        take(1)
      )
      .subscribe(org => {
        this.userUtcOffset = org.utcOffset;
      });

    this.loading = true;
    this.queueService
      .getQueuesFromCache()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        queues => {
          this.queues = queues;

          this.settings$ = this.personalSettingQuery.appSettings$.pipe(
            map(apps => {
              let result: CallcenterAppSettings = <CallcenterAppSettings>(
                apps.find(app => app.orgUuid === X.orgUuid && app.appId === environment.appId)
              );
              result = result || <CallcenterAppSettings>{ orgUuid: X.orgUuid, appId: environment.appId };
              result.orgUuid = X.orgUuid;
              result.appId = environment.appId;
              result.dashboard =
                result.dashboard ||
                <CallcenterDashboardSetting>{
                  queuesFiltering: this.queues.map(q => q.uuid),
                  autoRefreshTime: 5 * 60 * 1000,
                  timeRange: 'today'
                };

              return <CallcenterAppSettings>result;
            }),
            tap(settings => {
              this.resetTimer(settings);
            })
          );
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  ngOnDestroy() {
    this.destroyTimer$.next(true);
    this.destroyTimer$.complete();
  }

  onSwitchMetric(settings: CallcenterAppSettings) {
    this.personalSettingService.updateAppSettings(settings).subscribe();
  }

  onExport(settings: CallcenterAppSettings) {
    const req = this.calculateTimeRangeV4(settings);
    const inbound2$ = this.v4Service
      .getReportData<InboundDashboard>(req.period, ReportV4Code.dashboard.inbound + '.inapp2', req, null, false)
      .pipe(
        share(),
        map(resp => {
          return resp.rows.filter(
            x => settings.dashboard.queuesFiltering.findIndex(queue => queue === x.queueUuid) > -1
          );
        }),
        map(calls => <InboundDashboard[]>this.mergeDatabyPeriod(calls))
      );

    this.loading = true;
    inbound2$.pipe(finalize(() => (this.loading = false))).subscribe(inbound => {
      const data: DashboardCsv[] = [];
      const queue = this.queues.find(q => q.uuid === settings.dashboard.queuesFiltering[0]);

      const item = new DashboardCsv();
      item.QueueUuid = queue.uuid;
      item['Queue Name'] = new TitleCasePipe().transform(queue.label);

      item.Interval = req.period;
      inbound.forEach(call => {
        item['Date Time'] = call.dateTime ? format(call.dateTime, "yyyy-MM-dd'T'HH:mm:ssxxx") : '';
        item['Total Inbounds'] = call.totalCalls;
        item['Abandoned Calls'] = call.abandonedCalls;
        item[`Calls answered in ${queue.slaThreshold}s`] = call.answeredInThreshold20s;
        item['Answered Calls'] = call.answeredCalls;
        const valueSLA = call[`sla${queue.slaThreshold}s`];

        item.SLA = valueSLA == null || isNaN(valueSLA) ? '-' : new PercentPipe('en-US').transform(valueSLA, '1.2-2');
        item['Average Talk Time'] = format(
          set(new Date(), {
            hours: 0,
            minutes: 0,
            seconds: 0,
            milliseconds: call.avgTalkDuration || 0
          }),
          'HH:mm:ss'
        );
        item['Longest Waiting Time'] = format(
          set(new Date(), { hours: 0, minutes: 0, seconds: 0, milliseconds: call.longestQueueDuration || 0 }),
          'HH:mm:ss'
        );

        data.push(item);
      });

      if (data && data.length !== 0) {
        const replacer = (key, value) => (value === null ? '' : value); // specify how you want to handle null values here
        const header = [
          'QueueUuid',
          'Queue Name',
          'Date Time',
          'Interval',
          'Total Inbounds',
          'Abandoned Calls',
          'Calls answered in 20s',
          'Answered Calls',
          'SLA',
          'Average Talk Time',
          'Longest Waiting Time'
        ];
        const csvListItem = data.map(row =>
          header.map(fieldName => JSON.stringify(row[fieldName], replacer).replace(/\\"/g, '"')).join(',')
        );
        csvListItem.unshift(header.join(','));
        const csvData = csvListItem.join('\r\n');

        //Download the file as CSV
        const blob = new Blob(['\ufeff', csvData]);
        const start = format(utcToZonedTime(new Date(req.startTime), this.userUtcOffset), 'yyyyMMdd_HHmm');
        const end = format(utcToZonedTime(new Date(req.endTime), this.userUtcOffset), 'yyyyMMdd_HHmm');
        const fileName = `dashboard-${queue.label}-${start}-${end}.csv`; //Name the file here
        downloadData(blob, fileName);
        this.toastService.success('Export successfully');
      } else {
        this.toastService.error('Nothing to export');
      }
    });
  }

  private mergeDatabyPeriod(calls: InboundDashboard[]) {
    // api not support period 12h and 4h => use 1h => merge 4 times if 4h , merge 12 times if 12h
    const data: InboundDashboard[] = [];
    const numberOfEachQueue: HashMap<number> = {};
    calls.forEach(call => {
      const item = data.find(x => x.queueUuid === call.queueUuid);
      if (!item) {
        data.push(call);
        numberOfEachQueue[call.queueUuid] = 1;
      } else {
        item.answeredCalls += call.answeredCalls;
        item.avgTalkDuration += call.avgTalkDuration;
        item.avgQueueDuration += call.avgQueueDuration;
        item.abandonedCalls += call.abandonedCalls;
        item.abandonedRate += call.abandonedRate;
        item.shortAbandoned += call.shortAbandoned;
        item.longAbandoned += call.longAbandoned;
        item.unansweredCallbackCalls += call.unansweredCallbackCalls;
        item.voicemail += call.voicemail;
        item.totalCalls += call.totalCalls;

        item.answeredInThreshold5s += call.answeredInThreshold5s;
        item.answeredInThreshold10s += call.answeredInThreshold10s;
        item.answeredInThreshold15s += call.answeredInThreshold15s;
        item.answeredInThreshold20s += call.answeredInThreshold20s;
        item.answeredInThreshold30s += call.answeredInThreshold30s;
        item.answeredInThreshold45s += call.answeredInThreshold45s;
        item.answeredInThreshold60s += call.answeredInThreshold60s;
        item.answeredInThreshold90s += call.answeredInThreshold90s;

        item.longestQueueDuration =
          item.longestQueueDuration > call.longestQueueDuration ? item.longestQueueDuration : call.longestQueueDuration;

        item.currentCallsInQueue += call.currentCallsInQueue;

        item.sla5s += call.sla5s;
        item.sla10s += call.sla10s;
        item.sla15s += call.sla15s;
        item.sla20s += call.sla20s;
        item.sla30s += call.sla30s;
        item.sla45s += call.sla45s;
        item.sla60s += call.sla60s;
        item.sla90s += call.sla90s;
        numberOfEachQueue[call.queueUuid]++;
      }
    });
    data.forEach(t => {
      t.abandonedRate = t.abandonedRate / numberOfEachQueue[t.queueUuid];
      t.avgTalkDuration = t.avgTalkDuration / numberOfEachQueue[t.queueUuid];
      t.avgQueueDuration = t.avgQueueDuration / numberOfEachQueue[t.queueUuid];
      t.sla5s = t.sla5s / numberOfEachQueue[t.queueUuid];
      t.sla10s = t.sla10s / numberOfEachQueue[t.queueUuid];
      t.sla15s = t.sla15s / numberOfEachQueue[t.queueUuid];
      t.sla20s = t.sla20s / numberOfEachQueue[t.queueUuid];
      t.sla30s = t.sla30s / numberOfEachQueue[t.queueUuid];
      t.sla45s = t.sla45s / numberOfEachQueue[t.queueUuid];
      t.sla60s = t.sla60s / numberOfEachQueue[t.queueUuid];
      t.sla90s = t.sla90s / numberOfEachQueue[t.queueUuid];
    });
    return <InboundDashboard[]>data;
  }

  private resetTimer(settings: CallcenterAppSettings) {
    this.destroyTimer$.next(true);

    timer(0, settings.dashboard.autoRefreshTime)
      .pipe(
        takeUntil(this.destroyTimer$),
        filter(() => this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe)
      )
      .subscribe(() => {
        this.reloadComps(settings);
      });
  }

  private reloadComps(settings: CallcenterAppSettings) {
    this.fetchInboundStats(settings);
  }

  private fetchInboundStats(settings: CallcenterAppSettings) {
    const queues: QueueInfo[] = [];
    settings.dashboard.queuesFiltering.forEach(queueUuid => {
      const queue = this.queues.find(q => q.uuid === queueUuid);
      if (queue) {
        queues.push(queue);
      }
    });

    const findAgentsReq = new FindAgentsReq();
    settings.dashboard.queuesFiltering.forEach(q => {
      findAgentsReq.queues.push(q);
    });

    const req = this.calculateTimeRangeV4(settings);

    const agentStatusStream$ = this.agentService.findAgents(findAgentsReq).pipe(share());

    const inbound2$ = this.v4Service
      .getReportData<InboundDashboard>(req.period, ReportV4Code.dashboard.inbound + '.inapp2', req, null, false)
      .pipe(
        share(),
        map(resp => {
          return resp.rows.filter(x => queues.findIndex(queue => queue.uuid === x.queueUuid) > -1);
        }),
        // tap(a => console.log(a)),
        map(calls => <InboundDashboard[]>this.mergeDatabyPeriod(calls))
        // tap(a => console.log(a))
      );

    setTimeout(() => {
      this.callStatisticComponent.reload(inbound2$);
      this.abandonedRateComponent.reload(queues, inbound2$);
      this.slaComponent.reload(queues, inbound2$);
      this.agentListComponent.reload(agentStatusStream$);
      this.currentCallsInQueueComponent.reload(queues, inbound2$);
      this.longestWaitTimeComponent.reload(queues, inbound2$);
      this.agentStatisticComponent.reload(agentStatusStream$);
      this.averageCallDurationComponent.reload(queues, inbound2$);
      this.averageWaitTimeComponent.reload(queues, inbound2$);
    });
  }

  private calculateTimeRangeV4(settings: CallcenterAppSettings): GetReportV4Payload {
    const timeRange = TimeRangeHelper.buildTimeRangeFromKey(settings.dashboard.timeRange, this.userUtcOffset);

    if (settings.dashboard.timeRange === TimeRangeKey.specific_date) {
      if (settings.dashboard.dateFiltering) {
        timeRange.startDate = format(
          startOfDay(utcToZonedTime(new Date(settings.dashboard.dateFiltering), this.userUtcOffset)),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: this.userUtcOffset
          }
        );
        timeRange.endDate = format(
          addDays(startOfDay(utcToZonedTime(new Date(settings.dashboard.dateFiltering), this.userUtcOffset)), 1),
          "yyyy-MM-dd'T'HH:mm:ssxxx",
          {
            timeZone: this.userUtcOffset
          }
        );
      }
    }

    let period: string = settings.dashboard.timeRange;
    if (
      settings.dashboard.timeRange === TimeRangeKey.specific_date ||
      settings.dashboard.timeRange === TimeRangeKey.today
    ) {
      period = Period['1d'];
    } else if (
      settings.dashboard.timeRange === TimeRangeKey['4h'] ||
      settings.dashboard.timeRange === TimeRangeKey['12h']
    ) {
      period = Period['1h'];
    }

    return <GetReportV4Payload>{
      startTime: timeRange.startDate,
      endTime: timeRange.endDate,
      period
    };
  }
}
