import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import {
  Agent,
  AgentService,
  AgentStatus,
  FindAgentsReq,
  QueueInfo,
  QueueService,
  SystemStatusCode
} from '@b3networks/api/callcenter';
import { ActivityReport, AgentReport, GetReportV4Payload, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import {
  CallcenterAppSettings,
  CallcenterCallFeature,
  PersonalSettingsQuery,
  PersonalSettingsService
} from '@b3networks/api/portal';
import { ActiveIframeService, WindownActiveService } from '@b3networks/api/workspace';
import { APP_IDS, downloadData, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { EventMessageService } from '@b3networks/shared/utils/message';
import { addDays, isToday, startOfDay } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { cloneDeep } from 'lodash';
import { forkJoin, Observable, Subject, Subscription, timer } from 'rxjs';
import { filter, finalize, map, mergeMap, take, takeUntil, tap } from 'rxjs/operators';
import { AgentStatusChanged } from '../../event/agent-changed.evt';
import { BusyNoteComponent } from '../busy-note/busy-note.component';
import { AssignQueuesComponent } from './assign-queues/assign-queues.component';

class AgentInfoData {
  sla: string;
  assigned: string;
  answered: string;
  unanswered: string;
  avgTalkDuration: number;
  maxTalkDuration: number;
  sumAvailableDurationInSeconds: number;
  awayDurationInSeconds: number;
  sumBusyDurationInSeconds: number;
  sumOfflineDurationInSeconds: number;
}

const ALL_QUEUES = 'all_queues';

@Component({
  selector: 'b3n-agent-list',
  templateUrl: './agent-list.component.html',
  styleUrls: ['./agent-list.component.scss']
})
export class AgentListComponent implements OnInit, OnDestroy {
  displayedColumns = [];

  readonly AgentStatus = AgentStatus;
  readonly SystemStatusCode = SystemStatusCode;

  settings$: Observable<CallcenterAppSettings>;

  timezone: string;
  queues: QueueInfo[];

  agentDataSource: MatTableDataSource<Agent>;
  agentInfoMapping: { [Tkey in string]: AgentInfoData } = {};

  stopPolling: Subject<boolean> = new Subject();

  fetching: boolean;

  agentStatusChangedSub: Subscription;

  loading = true;

  constructor(
    private profileQuery: IdentityProfileQuery,
    private agentService: AgentService,
    private queueService: QueueService,
    private eventBus: EventMessageService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private personalSettingQuery: PersonalSettingsQuery,
    private personalSettingService: PersonalSettingsService,
    private v4Service: V4Service,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService
  ) {}

  ngOnInit() {
    this.fetching = true;

    this.queueService
      .loadQueueList()
      .pipe(
        finalize(() => {
          this.fetching = false;
          this.loading = false;
        })
      )
      .subscribe(
        queues => {
          this.queues = queues;

          this.settings$ = this.personalSettingQuery.appSettings$.pipe(
            map(apps => {
              let result = <CallcenterAppSettings>(
                apps.find(app => app.orgUuid === X.orgUuid && app.appId === APP_IDS.WALLBOARD)
              );
              result = result || <CallcenterAppSettings>{ orgUuid: X.orgUuid, appId: APP_IDS.WALLBOARD };
              result.workspaceAgents = result.workspaceAgents || {
                queueFiltering: ALL_QUEUES,
                autoRefreshTime: 5 * 60 * 1000,
                dateFiltering: {
                  startDate: utcToZonedTime(startOfDay(new Date()), this.timezone),
                  endDate: utcToZonedTime(startOfDay(new Date()), this.timezone)
                },
                isLatestDate: true,
                sortBy: 'status'
              };
              if (result.workspaceAgents.isLatestDate) {
                result.workspaceAgents.dateFiltering = {
                  startDate: utcToZonedTime(startOfDay(new Date()), this.timezone),
                  endDate: utcToZonedTime(startOfDay(new Date()), this.timezone)
                };
              }
              return result;
            }),
            tap(settings => {
              this.stopPolling.next(true);

              this.pollingData(settings);
            })
          );
        },
        err => {
          this.toastService.error(err.message);
        }
      );

    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        take(1)
      )
      .subscribe(org => {
        this.timezone = org.utcOffset;
      });

    this.agentStatusChangedSub = this.eventBus.message$
      .pipe(
        filter(me => me instanceof AgentStatusChanged),
        map(message => message as AgentStatusChanged)
      )
      .subscribe(message => {
        if (message.agent && this.agentDataSource) {
          const agentIndex = this.agentDataSource.data.findIndex(
            agent => agent.identityUuid === message.agent.identityUuid
          );
          if (agentIndex > -1) {
            this.agentDataSource.data[agentIndex].syncupNewStatus(message.agent);
          }
        }
      });
  }

  ngOnDestroy() {
    if (this.stopPolling) {
      this.stopPolling.next(true);
    }
    this.agentStatusChangedSub.unsubscribe();
  }

  onFilter(settings: CallcenterAppSettings) {
    if (isToday(new Date(settings.workspaceAgents.dateFiltering.startDate))) {
      settings.workspaceAgents.isLatestDate = true;
    } else {
      settings.workspaceAgents.isLatestDate = false;
    }
    this.personalSettingService.updateAppSettings(settings).subscribe();
  }

  changeStatus(agent: Agent, newStatus: AgentStatus) {
    if (agent.status === newStatus) {
      return;
    }
    switch (newStatus) {
      case AgentStatus.available:
      case AgentStatus.offline:
      case AgentStatus.dnd:
        this.updateAgentStatus(agent, newStatus);
        break;
      case AgentStatus.busy:
        this.busy(agent);
        break;
    }
  }

  assignQueues(agent: Agent, settings: CallcenterAppSettings) {
    this.dialog
      .open(AssignQueuesComponent, {
        minWidth: '400px',
        data: {
          agent: agent,
          queues: this.queues
        }
      })
      .afterClosed()
      .subscribe(data => {
        if (data) {
          this.pollingData(settings);
        }
      });
  }

  export(settings: CallcenterAppSettings) {
    const startTime = settings.workspaceAgents.dateFiltering.startDate
      ? new Date(settings.workspaceAgents.dateFiltering.startDate)
      : new Date();
    const endTime = settings.workspaceAgents.dateFiltering.endDate
      ? new Date(settings.workspaceAgents.dateFiltering.endDate)
      : new Date();

    const req = <GetReportV4Payload>{
      startTime: format(startOfDay(startTime), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timezone
      }),
      endTime: format(addDays(startOfDay(endTime), 1), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timezone
      }),
      orgUuid: X.orgUuid
    };
    this.v4Service
      .getReportData(Period['1d'], ReportV4Code.callcenter.performance + '.inapp', req, null, true)
      .pipe()
      .subscribe(response => {
        const replacer = (key, value) => (value === null ? '' : value);
        const fileName = `${response['label']}.csv`;

        const header = [
          'Agent',
          'Number of Queues',
          'Average Talktime',
          'Maximum Talktime',
          'Assigned Calls',
          'Answered Calls',
          'Unanswered Calls',
          'Available Duration',
          'Busy Duration',
          'Away Duration',
          'Offline Duration',
          'SLA'
        ];
        const dataExport = response['rows'].filter(
          x => this.agentDataSource.data.findIndex(agent => agent.identityUuid === x['agentUuid']) > -1
        );

        if (dataExport.length > 0) {
          const csvListItem = dataExport.map(row =>
            header.map(fieldName => JSON.stringify(row[fieldName], replacer).replace(/\\"/g, '"')).join(',')
          );
          csvListItem.unshift(header.join(','));
          const csvData = csvListItem.join('\r\n');
          const blob = new Blob(['\ufeff', csvData]);

          downloadData(blob, fileName);
          this.toastService.success('Export successfully');
        } else {
          this.toastService.error('Nothing to export');
        }
      });
  }

  private busy(agent: Agent) {
    this.dialog
      .open(BusyNoteComponent, {
        data: {}
      })
      .afterClosed()
      .subscribe(result => {
        if (result && result.reason) {
          this.updateAgentStatus(agent, AgentStatus.busy, result.reason);
        }
      });
  }

  private updateAgentStatus(agent: Agent, status: AgentStatus, reason?: string) {
    const action: 'login' | 'busy' | 'logout' | 'dnd' =
      status === AgentStatus.available
        ? 'login'
        : status === AgentStatus.busy
        ? 'busy'
        : status === AgentStatus.dnd
        ? 'dnd'
        : 'logout';

    this.loading = true;
    this.agentService
      .changeAgentStatus(agent.identityUuid, action, reason)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(
        updatedAgentData => {
          agent.syncupNewStatus(updatedAgentData);
          this.eventBus.sendMessage(new AgentStatusChanged({ agent: agent }));
          this.toastService.success("Agent's status has been updated");
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  private pollingData(settings: CallcenterAppSettings) {
    this.setDisplayedColumns(settings);
    this.stopPolling.next(true);
    timer(0, settings.workspaceAgents.autoRefreshTime)
      .pipe(
        filter(() => this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe),
        mergeMap(_ => {
          this.fetching = true;
          return this.fetchData(settings).pipe(finalize(() => (this.fetching = false)));
        }),
        takeUntil(this.stopPolling)
      )
      .subscribe(([agents, incoming, activityReports]: [Agent[], AgentReport[], ActivityReport[]]) => {
        const copyAgents = cloneDeep(agents);
        this.transferDataAgents(copyAgents, settings);
        this.agentDataSource = new MatTableDataSource(copyAgents);

        this.agentInfoMapping = {};
        incoming.forEach(query => {
          const key = `${query.agentUuid}-${settings.workspaceAgents.queueFiltering}`;
          const agentData = new AgentInfoData();
          agentData.sla = query['SLA'];
          agentData.assigned = query['Assigned Calls'];
          agentData.answered = query['Answered Calls'];
          agentData.unanswered = query['Unanswered Calls'];
          agentData.avgTalkDuration = this.getSeconds(query['Average Talktime']);
          agentData.maxTalkDuration = this.getSeconds(query['Maximum Talktime']);

          agentData.sumAvailableDurationInSeconds = this.getSeconds(query['Available Duration']);
          agentData.awayDurationInSeconds = this.getSeconds(query['Away Duration']);
          agentData.sumBusyDurationInSeconds = this.getSeconds(query['Busy Duration']);
          agentData.sumOfflineDurationInSeconds = this.getSeconds(query['Offline Duration']);
          this.agentInfoMapping[key] = agentData;
        });
      });
  }

  getSeconds(duration: string): number {
    const [hours, minutes, seconds] = duration.split(':');
    return +hours * 60 * 60 + +minutes * 60 + +seconds;
  }

  private transferDataAgents(agents: any, settings: CallcenterAppSettings) {
    if (settings.workspaceAgents.sortBy) {
      if (settings.workspaceAgents.sortBy !== 'name') {
        this.sortAgent(agents, 'name');
      }
      this.sortAgent(agents, settings.workspaceAgents.sortBy);
    }

    // find name queues
    // agents.forEach((agent: Agent) => {
    //   agent.assignedQueueLabels = [];
    //   agent.assignedQueues.forEach(queue => {
    //     const filteredQueue = this.queues.find(q => q.uuid === queue);
    //     if (filteredQueue) {
    //       agent.assignedQueueLabels.push(filteredQueue.label);
    //     }
    //   });
    // });
  }

  private sortAgent(agents: Agent[], sortBy: string) {
    agents.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayText.localeCompare(b.displayText);
        case 'status':
          return a.statusPriority > b.statusPriority ? 1 : a.statusPriority < b.statusPriority ? -1 : 0;
        case 'extension':
          return a.extKey.localeCompare(b.extKey);
        default:
          return a.extKey.localeCompare(b.extKey);
      }
    });
  }

  private fetchData(settings: CallcenterAppSettings) {
    // body of mapping
    // const date = settings.workspaceAgents.isLatestDate ? new Date() : new Date(settings.workspaceAgents.dateFiltering);
    let startDate = startOfDay(utcToZonedTime(new Date(), this.timezone));
    let endDate = startOfDay(utcToZonedTime(new Date(), this.timezone));
    if (!settings.workspaceAgents.isLatestDate) {
      startDate = startOfDay(
        utcToZonedTime(
          settings.workspaceAgents.dateFiltering.startDate
            ? new Date(settings.workspaceAgents.dateFiltering.startDate)
            : new Date(),
          this.timezone
        )
      );
      endDate = startOfDay(
        utcToZonedTime(
          settings.workspaceAgents.dateFiltering.endDate
            ? new Date(settings.workspaceAgents.dateFiltering.endDate)
            : new Date(),
          this.timezone
        )
      );
    }

    // const filterDateWithUserzone = startOfDay(utcToZonedTime(date, this.timezone));
    const req = <Partial<GetReportV4Payload>>{
      startTime: format(startDate, "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timezone
      }),
      endTime: format(addDays(endDate, 1), "yyyy-MM-dd'T'HH:mm:ssxxx", {
        timeZone: this.timezone
      }),
      filter: {}
    };
    // if (settings.workspaceAgents.queueFiltering !== ALL_QUEUES) {
    //   req.filter.queueUuid = settings.workspaceAgents.queueFiltering;
    // }

    // body of agent
    const findAgentsReq = new FindAgentsReq();
    if (settings.workspaceAgents.queueFiltering !== ALL_QUEUES) {
      findAgentsReq.queues = [settings.workspaceAgents.queueFiltering];
    }

    return forkJoin([
      this.agentService.findAgents(findAgentsReq),
      this.v4Service
        .getReportData(
          Period['1d'],
          ReportV4Code.callcenter.performance + '.inapp',
          <GetReportV4Payload>req,
          null,
          true
        )
        .pipe(map(resp => resp.rows.map(x => new AgentReport(x)))),
      this.v4Service
        .getReportData<ActivityReport>(
          Period['1d'],
          ReportV4Code.callcenter.activity + '.inapp',
          <GetReportV4Payload>req
        )
        .pipe(map(resp => resp.rows.map(x => new ActivityReport(x))))
    ]);
  }

  private setDisplayedColumns(settings: CallcenterAppSettings) {
    if (settings.callFeature === CallcenterCallFeature.outbound) {
      this.displayedColumns = [
        'agent-status',
        'state',
        'duration',
        'queues',
        'available',
        'away',
        'busy',
        'offline',
        'action'
      ];
    } else {
      this.displayedColumns = [
        'agent-status',
        'state',
        'duration',
        'queues',
        'sla',
        'assigned',
        'answered',
        'unanswered',
        'avg-talk-time',
        'max-talk-time',
        'available',
        'away',
        'busy',
        'offline',
        'action'
      ];
    }
  }
}
