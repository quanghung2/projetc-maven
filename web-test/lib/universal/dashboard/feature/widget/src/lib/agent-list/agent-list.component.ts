import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { AgentStatus, Me, MeQuery } from '@b3networks/api/callcenter';
import { ChartType } from '@b3networks/api/dashboard';
import { filter } from 'rxjs/operators';
import { WidgetData } from '../model/widget.model';
import { WidgetTransformService } from '../service/widget-transform.service';
import { AgentRecord, AgentRecordV2 } from './agent-list.model';

@Component({
  selector: 'b3n-agent-list',
  templateUrl: './agent-list.component.html',
  styleUrls: ['./agent-list.component.scss']
})
export class AgentListComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;
  @Input() isV2: boolean = false;

  chartData: any;

  agentRecords: (AgentRecord | AgentRecordV2)[] = [];
  filteredData: (AgentRecord | AgentRecordV2)[] = [];
  me: Me;
  filterAgentsCtrl: UntypedFormControl = new UntypedFormControl();

  readonly AgentStatus = AgentStatus;
  readonly ChartType = ChartType;
  readonly ObjectKeys = Object.keys;
  readonly displayColumns = [
    'agent',
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
    'busy',
    'offline'
  ];

  readonly displayColumnsV2 = [
    'agent',
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
    'busy',
    'offline',
    'away'
  ];

  constructor(private widgetTransform: WidgetTransformService, private meQuery: MeQuery) {
    this.meQuery
      .select('me')
      .pipe(filter(me => !!me))
      .subscribe(me => {
        this.me = me;
      });
  }

  ngOnInit() {}

  ngOnChanges() {
    if (!this.data) {
      return;
    }

    this.chartData = this.widgetTransform.buildChartData(this.data);
    const agentSet = new Set<string>();
    const datasetMap: any = {};
    this.chartData.datasets.forEach(dataset => {
      const id = dataset['id'];

      if (id === 'agent') {
        dataset.data.forEach((row: any[]) => {
          agentSet.add(row[0]);
        });
      }
      const agentMapping = {};
      dataset.data.forEach((row: any[]) => {
        agentMapping[row[0]] = row;
      });

      datasetMap[id] = agentMapping;
    });

    this.agentRecords = Array.from(agentSet)
      .map(agentUuid => {
        if (this.isV2) {
          const agent = datasetMap['agent'][agentUuid];
          const agentPerfomance = datasetMap['agentPerfomance'][agentUuid];

          return new AgentRecordV2({
            uuid: agentUuid,
            agent: agent ? agent[1] : '',
            extKey: agent ? agent[2] : '',
            numberOfQueue: agent ? agent[3] : 0,
            status: agent ? agent[4] : '',
            systemStatus: agent ? agent[5] : '',
            statusDuration: agent ? agent[6] : 0,
            sla: agentPerfomance ? agentPerfomance[1] : '0%',
            assigned: agentPerfomance ? agentPerfomance[2] : 0,
            answered: agentPerfomance ? agentPerfomance[3] : 0,
            unanswered: agentPerfomance ? agentPerfomance[4] : 0,
            avgTalkDuration: agentPerfomance ? this.convertToMs(agentPerfomance[5]) : 0,
            maxTalkDuration: agentPerfomance ? this.convertToMs(agentPerfomance[6]) : 0,
            sumAvailableDuration: agentPerfomance ? this.convertToMs(agentPerfomance[7]) : 0,
            sumAwayDuration: agentPerfomance ? this.convertToMs(agentPerfomance[8]) : 0,
            sumBusyDuration: agentPerfomance ? this.convertToMs(agentPerfomance[9]) : 0,
            sumOfflineDuration: agentPerfomance ? this.convertToMs(agentPerfomance[10]) : 0
          });
        } else {
          const agent = datasetMap['agent'][agentUuid];
          const incoming = datasetMap['incoming'][agentUuid];
          const callback = datasetMap['callback'][agentUuid];
          const activities = datasetMap['activity'][agentUuid];

          return new AgentRecord({
            uuid: agentUuid,
            agent: agent ? agent[1] : '',
            assignedQueues: agent ? agent[2] : [],
            status: agent ? agent[3] : '',
            systemStatus: agent ? agent[4] : '',
            lastChangeStatusAt: agent ? agent[5] : 0,
            lastAssignedAt: agent ? agent[6] : 0,
            lastPickupAt: agent ? agent[7] : 0,
            lastUnassignedAt: agent ? agent[8] : 0,
            lastFreeAt: agent ? agent[9] : 0,
            incomingAssigned: incoming ? incoming[1] : 0,
            callbackAssigned: callback ? callback[1] : 0,
            incomingAnswered: incoming ? incoming[2] : 0,
            incomingUnanswered: incoming ? incoming[3] : 0,
            callbackAnswered: callback ? callback[2] : 0,
            callbackUnanswered: callback ? callback[3] : 0,
            incomingSumTalkDuration: incoming ? incoming[4] : 0,
            callbackSumTalkDuration: callback ? callback[4] : 0,
            incomingMaxTalkDuration: incoming ? incoming[5] : 0,
            callbackMaxTalkDuration: callback ? callback[5] : 0,
            sumAvailableDuration: activities ? activities[1] : 0,
            sumOfflineDuration: activities ? activities[2] : 0,
            sumBusyDuration: activities ? activities[3] : 0
          });
        }
      })
      .sort((a: any, b: any) => (this.isV2 ? a.agentLabel.localeCompare(b.agentLabel) : a.agent > b.agent ? 1 : -1))
      .sort((a: any, b: any) =>
        this.isV2
          ? a.statusPriority > b.statusPriority
            ? 1
            : a.statusPriority < b.statusPriority
            ? -1
            : 0
          : a.status > b.status
          ? 1
          : -1
      );

    if (!this.me?.isSupervisor) {
      this.agentRecords = this.agentRecords.filter(record => record.uuid === this.me?.identityUuid);
    }

    if (!this.filterAgentsCtrl.value) {
      this.filterAgentsCtrl.setValue(this.agentRecords.map(agent => agent.uuid));
    }

    this.onFilteredAgents();
  }

  onFilteredAgents(): void {
    this.filteredData = this.agentRecords.filter(record => this.filterAgentsCtrl.value.includes(record.uuid));
  }

  unSelectAll() {
    this.filterAgentsCtrl.setValue([]);
    this.onFilteredAgents();
  }

  selectAll() {
    this.filterAgentsCtrl.setValue(this.agentRecords.map(agent => agent.uuid));
    this.onFilteredAgents();
  }

  // hh:MM:ss
  convertToMs(duration: string) {
    if (!duration) {
      return 0;
    }

    const [hours, minutes, seconds] = duration.split(':');
    return +hours * 3.6e6 + +minutes * 60000 + +seconds * 1000;
  }
}
