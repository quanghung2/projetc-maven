import { KeyValue } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ExecutionLog,
  FlowVersionMapping,
  GetLogsReq,
  GroupByLog,
  LogQuery,
  SimpleAppFlowService,
  ViewDetailReq
} from '@b3networks/api/flow';
import { TimeRangeKey } from '@b3networks/shared/common';
import { subDays } from 'date-fns';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { TypeLoadMore } from './log-table/log-table.component';

@Component({
  selector: 'b3n-flow-log',
  templateUrl: './flow-log.component.html',
  styleUrls: ['./flow-log.component.scss']
})
export class FlowLogComponent implements OnInit {
  @Input() projectUuid: string;
  @Input() flowVerMaps: FlowVersionMapping[] = [];

  readonly TimeRangeKey = TimeRangeKey;
  readonly timeRanges: KeyValue<TimeRangeKey, string>[] = [
    { key: TimeRangeKey.today, value: 'Today' },
    { key: TimeRangeKey.yesterday, value: 'Yesterday' },
    { key: TimeRangeKey.last7days, value: 'Last 7 days' },
    { key: TimeRangeKey.last14days, value: 'Last 14 days' },
    { key: TimeRangeKey.specific_date, value: 'Specific date time' }
  ];

  timeRangeCtrl = new UntypedFormControl(TimeRangeKey.today);
  fromTimeCtrl = new UntypedFormControl(new Date().setHours(0, 0, 0, 0), Validators.required);
  toTimeCtrl = new UntypedFormControl('');
  flowUuidCtrl = new UntypedFormControl('');
  versionCtrl = new UntypedFormControl(0);
  keywordCtrl = new UntypedFormControl('');
  statusCtrl = new UntypedFormControl('');
  sortCtrl = new UntypedFormControl('desc');

  minStart = subDays(new Date().setHours(0, 0, 0, 0), 14);
  maxStart = new Date();
  minEnd = subDays(new Date().setHours(0, 0, 0, 0), 14);
  maxEnd = new Date();
  versions: number[] = [];

  readonly size = 10;
  curLogs: (ExecutionLog | GroupByLog)[] = [];
  nextCursorRunning: number;
  nextCursorDone: number;
  loading: boolean;
  pending: boolean;
  viewDetailReq: ViewDetailReq;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private simpleAppService: SimpleAppFlowService,
    private logQuery: LogQuery
  ) {}

  ngOnInit(): void {
    this.versionCtrl.disable();

    this.timeRangeCtrl.valueChanges.subscribe((range: TimeRangeKey) => {
      switch (range) {
        case TimeRangeKey.today:
          this.fromTimeCtrl.setValue(subDays(new Date().setHours(0, 0, 0, 0), 0));
          this.toTimeCtrl.setValue('');
          break;
        case TimeRangeKey.yesterday:
          this.fromTimeCtrl.setValue(subDays(new Date().setHours(0, 0, 0, 0), 1));
          this.toTimeCtrl.setValue(subDays(new Date().setHours(23, 59, 59, 999), 1));
          break;
        case TimeRangeKey.last7days:
          this.fromTimeCtrl.setValue(subDays(new Date().setHours(0, 0, 0, 0), 7));
          this.toTimeCtrl.setValue('');
          break;
        case TimeRangeKey.last14days:
          this.fromTimeCtrl.setValue(subDays(new Date().setHours(0, 0, 0, 0), 14));
          this.toTimeCtrl.setValue('');
          break;
        case TimeRangeKey.specific_date:
          this.fromTimeCtrl.setValue('');
          this.toTimeCtrl.setValue('');
          break;
      }
    });

    this.flowUuidCtrl.valueChanges.subscribe(flowUuid => {
      this.versionCtrl.setValue(0);
      if (flowUuid) {
        this.versions = this.flowVerMaps.find(f => f.flowUuid == flowUuid).versions;
        this.versionCtrl.enable();
      } else {
        this.versions.length = 0;
        this.versionCtrl.disable();
      }
    });

    const filterLogs = this.logQuery.getValue().filterLogs;
    if (filterLogs) {
      if (filterLogs.timeRange) {
        this.timeRangeCtrl.setValue(filterLogs.timeRange);
        this.fromTimeCtrl.setValue(
          filterLogs.startTime ? new Date(filterLogs.startTime) : new Date().setHours(0, 0, 0, 0)
        );
        this.toTimeCtrl.setValue(filterLogs.endTime ? new Date(filterLogs.endTime) : '');
      }
      if (filterLogs.flowUuid) {
        this.flowUuidCtrl.setValue(filterLogs.flowUuid);
        this.versionCtrl.setValue(filterLogs.version);
      }
      this.statusCtrl.setValue(filterLogs.status ?? '');
      this.sortCtrl.setValue(filterLogs.sortDirection ?? 'desc');
      this.keywordCtrl.setValue(filterLogs.keyword ?? '');
      this.curLogs = this.logQuery.getValue().dataLogs;
      if (!this.curLogs) {
        this.getExcutionLogs(false);
      }
    } else {
      this.getExcutionLogs(false);
    }

    const params = this.route.snapshot.params;
    if (params['flowUuid'] && params['version'] && params['id']) {
      this.viewDetailReq = {
        flowUuid: params['flowUuid'],
        flowName: this.flowVerMaps.find(f => f.flowUuid === params['flowUuid']).flowName,
        version: Number(params['version']),
        id: Number(params['id']),
        tab: ''
      };
    }
  }

  fromDateChange() {
    this.minEnd = new Date(this.fromTimeCtrl.value);
  }

  toDateChange() {
    this.maxStart = new Date(this.toTimeCtrl.value);
  }

  goToActiveVersion() {
    const activeVersion = this.flowVerMaps.find(f => f.flowUuid == this.flowUuidCtrl.value).activeVersion;
    if (activeVersion) {
      this.router.navigate(['../flow', this.flowUuidCtrl.value, activeVersion], { relativeTo: this.route.parent });
    }
  }

  private getGroupNameLog(groupName: string, type: string, isGroupBy: boolean, isNextCursor: boolean) {
    return <GroupByLog>{
      groupName: groupName,
      isGroupBy: isGroupBy,
      type,
      isNextCursor
    };
  }

  getExcutionLogs(buyTimeLoading: boolean = true) {
    if (this.fromTimeCtrl.invalid) {
      return;
    }
    this.nextCursorDone = null;
    this.nextCursorRunning = null;
    this.loading = true;
    if (buyTimeLoading) {
      this.pending = true;
    }
    forkJoin([
      this.simpleAppService.getLogDone(this.projectUuid, <GetLogsReq>{
        nextCursor: this.nextCursorDone,
        size: this.size,
        timeRange: this.timeRangeCtrl.value,
        startTime: this.fromTimeCtrl.value !== '' ? this.fromTimeCtrl.value.valueOf() : null,
        endTime: this.toTimeCtrl.value !== '' ? this.toTimeCtrl.value.valueOf() : null,
        flowUuid: this.flowUuidCtrl.value,
        version: this.versionCtrl.value,
        keyword: this.keywordCtrl.value,
        status: this.statusCtrl.value,
        sortDirection: this.sortCtrl.value
      }),
      this.simpleAppService.getLogRunning(this.projectUuid, <GetLogsReq>{
        nextCursor: this.nextCursorRunning,
        size: this.size,
        timeRange: this.timeRangeCtrl.value,
        startTime: this.fromTimeCtrl.value !== '' ? this.fromTimeCtrl.value.valueOf() : null,
        endTime: this.toTimeCtrl.value !== '' ? this.toTimeCtrl.value.valueOf() : null,
        flowUuid: this.flowUuidCtrl.value,
        version: this.versionCtrl.value,
        keyword: this.keywordCtrl.value,
        status: this.statusCtrl.value,
        sortDirection: this.sortCtrl.value
      })
    ])
      .pipe(
        finalize(() => {
          this.loading = false;
          setTimeout(
            () => {
              this.pending = false;
            },
            buyTimeLoading ? 3000 : 0
          );
        })
      )
      .subscribe(([logsDone, logsRunning]) => {
        this.curLogs = [];

        if (logsRunning.data?.length) {
          this.nextCursorRunning = logsRunning.nextCursor;
          this.curLogs = [
            this.getGroupNameLog('Running', 'RUNNING', true, false),
            ...logsRunning.data.map(item => ({ ...item, type: 'RUNNING' }))
          ];
          if (logsRunning.nextCursor) {
            this.curLogs.push(this.getGroupNameLog('Load more', 'RUNNING', false, !!logsRunning.nextCursor));
          }
        }

        if (logsDone.data?.length) {
          this.nextCursorDone = logsDone.nextCursor;
          this.curLogs = [
            ...this.curLogs,
            this.getGroupNameLog('Done', 'DONE', true, false),
            ...logsDone.data.map(item => ({ ...item, type: 'DONE' }))
          ];
          if (logsDone.nextCursor) {
            this.curLogs.push(this.getGroupNameLog('Load more', 'DONE', false, !!logsDone.nextCursor));
          }
        }

        this.simpleAppService.updateDataLogs(this.curLogs);
      });
  }

  onLoadMore(type: TypeLoadMore) {
    if (type.isLogDone) {
      this.getMoreLogsDone();
      return;
    }

    if (type.isLogRunning) {
      this.getMoreLogsRunning();
    }
  }

  private insert(arr: (ExecutionLog | GroupByLog)[] = [], index: number, newItems: ExecutionLog[] = []) {
    return [...arr.slice(0, index), ...newItems, ...arr.slice(index)];
  }

  private getMoreLogsDone() {
    this.loading = true;
    const request = <GetLogsReq>{
      nextCursor: this.logQuery.getValue().nextCursorDone ?? this.nextCursorDone,
      size: this.size,
      timeRange: this.timeRangeCtrl.value,
      startTime: this.fromTimeCtrl.value !== '' ? this.fromTimeCtrl.value.valueOf() : null,
      endTime: this.toTimeCtrl.value !== '' ? this.toTimeCtrl.value.valueOf() : null,
      flowUuid: this.flowUuidCtrl.value,
      version: this.versionCtrl.value,
      keyword: this.keywordCtrl.value,
      status: this.statusCtrl.value,
      sortDirection: this.sortCtrl.value
    };

    this.simpleAppService
      .getLogDone(this.projectUuid, request)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(logs => {
        const indexLoadmore = this.curLogs.findIndex(item => item?.['type'] === 'DONE' && item?.['isNextCursor']);
        this.curLogs = this.insert(this.curLogs, indexLoadmore, logs.data).map(item => ({ ...item, type: 'DONE' }));

        if (!logs.nextCursor) {
          const indexLoadmoreAfterInsert = this.curLogs.findIndex(
            item => item?.['type'] === 'DONE' && item?.['isNextCursor']
          );
          this.curLogs.splice(indexLoadmoreAfterInsert, 1);
        }
        this.nextCursorDone = logs.nextCursor;

        this.simpleAppService.updateDataLogs(this.curLogs);
        this.simpleAppService.updateNextCursorDone(logs.nextCursor);
      });
  }

  private getMoreLogsRunning() {
    this.loading = true;
    this.simpleAppService
      .getLogRunning(this.projectUuid, <GetLogsReq>{
        nextCursor: this.logQuery.getValue().nextCursorRunning ?? this.nextCursorRunning,
        size: this.size,
        timeRange: this.timeRangeCtrl.value,
        startTime: this.fromTimeCtrl.value !== '' ? this.fromTimeCtrl.value.valueOf() : null,
        endTime: this.toTimeCtrl.value !== '' ? this.toTimeCtrl.value.valueOf() : null,
        flowUuid: this.flowUuidCtrl.value,
        version: this.versionCtrl.value,
        keyword: this.keywordCtrl.value,
        status: this.statusCtrl.value,
        sortDirection: this.sortCtrl.value
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(logs => {
        const indexLoadmore = this.curLogs.findIndex(item => item?.['type'] === 'RUNNING' && item?.['isNextCursor']);
        this.curLogs = this.insert(this.curLogs, indexLoadmore, logs.data).map(item => ({ ...item, type: 'RUNNING' }));

        if (!logs.nextCursor) {
          const indexLoadmoreAfterInsert = this.curLogs.findIndex(
            item => item?.['type'] === 'RUNNING' && item?.['isNextCursor']
          );
          this.curLogs.splice(indexLoadmoreAfterInsert, 1);
        }
        this.nextCursorRunning = logs.nextCursor;

        this.simpleAppService.updateDataLogs(this.curLogs);
        this.simpleAppService.updateNextCursorRunning(logs.nextCursor);
      });
  }
}
