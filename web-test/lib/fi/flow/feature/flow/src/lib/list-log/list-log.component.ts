import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import {
  ExecutionLog,
  ExecutionLogsQuery,
  ExecutionLogsService,
  FlowQuery,
  FlowService,
  GetLogsReq,
  GroupByLog
} from '@b3networks/api/flow';
import { DestroySubscriberComponent, TimeRangeKey } from '@b3networks/shared/common';
import { subDays } from 'date-fns';
import { forkJoin } from 'rxjs';
import { filter, finalize, take, takeUntil } from 'rxjs/operators';
import { TypeLoadMore } from './log-table/log-table.component';

@Component({
  selector: 'b3n-list-log',
  templateUrl: './list-log.component.html',
  styleUrls: ['./list-log.component.scss']
})
export class ListLogComponent extends DestroySubscriberComponent implements OnInit {
  readonly TimeRangeKey = TimeRangeKey;
  readonly timeRanges: KeyValue<TimeRangeKey, string>[] = [
    { key: TimeRangeKey.today, value: 'Today' },
    { key: TimeRangeKey.yesterday, value: 'Yesterday' },
    { key: TimeRangeKey.last7days, value: 'Last 7 days' },
    { key: TimeRangeKey.last14days, value: 'Last 14 days' },
    { key: TimeRangeKey.specific_date, value: 'Specific date time' }
  ];

  flowUuid: string;
  flowVersion: number;
  versions: number[] = [];
  viewVersion: number;
  timeRangeCtrl = new UntypedFormControl(TimeRangeKey.today);
  fromTimeCtrl = new UntypedFormControl(new Date().setHours(0, 0, 0, 0), Validators.required);
  toTimeCtrl = new UntypedFormControl('');
  sortCtrl = new UntypedFormControl('desc');
  keywordCtrl = new UntypedFormControl('');

  minStart = subDays(new Date().setHours(0, 0, 0, 0), 14);
  maxStart = new Date();
  minEnd = subDays(new Date().setHours(0, 0, 0, 0), 14);
  maxEnd = new Date();

  readonly size = 10;
  curLogs: (ExecutionLog | GroupByLog)[] = [];
  nextCursorRunning: number;
  nextCursorDone: number;
  loading: boolean;
  pending: boolean;

  constructor(
    private flowQuery: FlowQuery,
    private flowService: FlowService,
    private executionlogsQuery: ExecutionLogsQuery,
    private executionlogsService: ExecutionLogsService
  ) {
    super();
  }

  ngOnInit(): void {
    this.flowQuery
      .select()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(flow => !!flow.uuid),
        take(1)
      )
      .subscribe(flow => {
        this.flowUuid = flow.uuid;
        this.flowVersion = flow.version;
        this.viewVersion = flow.ui.viewLogVersion ?? flow.version;

        this.flowService.getVersions(this.flowUuid).subscribe(versions => {
          this.versions = versions;
        });

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

        const filterLogs = this.executionlogsQuery.getValue().filterLogs;
        if (filterLogs) {
          if (filterLogs.timeRange) {
            this.timeRangeCtrl.setValue(filterLogs.timeRange);
            this.fromTimeCtrl.setValue(
              filterLogs.startTime ? new Date(filterLogs.startTime) : new Date().setHours(0, 0, 0, 0)
            );
            this.toTimeCtrl.setValue(filterLogs.endTime ? new Date(filterLogs.endTime) : '');
          }
          this.sortCtrl.setValue(filterLogs.sortDirection);
          this.keywordCtrl.setValue(filterLogs.keyword ?? '');
          this.viewVersion = filterLogs.version;
          this.flowService.setViewLogVersion(this.viewVersion);
          this.curLogs = this.executionlogsQuery.getValue().dataLogs;
        } else {
          this.getExcutionLogs(false);
        }
      });
  }

  fromDateChange() {
    this.minEnd = new Date(this.fromTimeCtrl.value);
  }

  toDateChange() {
    this.maxStart = new Date(this.toTimeCtrl.value);
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
    this.flowService.setViewLogVersion(this.viewVersion);
    this.nextCursorDone = null;
    this.nextCursorRunning = null;
    this.loading = true;
    if (buyTimeLoading) {
      this.pending = true;
    }
    forkJoin([
      this.executionlogsService.getExecutionLogsDone(this.flowUuid, <GetLogsReq>{
        nextCursor: this.nextCursorDone,
        size: this.size,
        timeRange: this.timeRangeCtrl.value,
        startTime: this.fromTimeCtrl.value !== '' ? this.fromTimeCtrl.value.valueOf() : null,
        endTime: this.toTimeCtrl.value !== '' ? this.toTimeCtrl.value.valueOf() : null,
        version: this.viewVersion,
        keyword: this.keywordCtrl.value,
        sortDirection: this.sortCtrl.value
      }),
      this.executionlogsService.getExecutionLogsRunning(this.flowUuid, <GetLogsReq>{
        nextCursor: this.nextCursorRunning,
        size: this.size,
        timeRange: this.timeRangeCtrl.value,
        startTime: this.fromTimeCtrl.value !== '' ? this.fromTimeCtrl.value.valueOf() : null,
        endTime: this.toTimeCtrl.value !== '' ? this.toTimeCtrl.value.valueOf() : null,
        version: this.viewVersion,
        keyword: this.keywordCtrl.value,
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

        this.executionlogsService.updateDataLogs(this.curLogs);
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
      nextCursor: this.executionlogsQuery.getValue().nextCursorDone ?? this.nextCursorDone,
      size: this.size,
      timeRange: this.timeRangeCtrl.value,
      startTime: this.fromTimeCtrl.value !== '' ? this.fromTimeCtrl.value.valueOf() : null,
      endTime: this.toTimeCtrl.value !== '' ? this.toTimeCtrl.value.valueOf() : null,
      version: this.viewVersion,
      keyword: this.keywordCtrl.value,
      sortDirection: this.sortCtrl.value
    };

    this.executionlogsService
      .getExecutionLogsDone(this.flowUuid, request)
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

        this.executionlogsService.updateDataLogs(this.curLogs);
        this.executionlogsService.updateNextCursorDone(logs.nextCursor);
      });
  }

  private getMoreLogsRunning() {
    this.loading = true;
    this.executionlogsService
      .getExecutionLogsRunning(this.flowUuid, <GetLogsReq>{
        nextCursor: this.executionlogsQuery.getValue().nextCursorRunning ?? this.nextCursorRunning,
        size: this.size,
        timeRange: this.timeRangeCtrl.value,
        startTime: this.fromTimeCtrl.value !== '' ? this.fromTimeCtrl.value.valueOf() : null,
        endTime: this.toTimeCtrl.value !== '' ? this.toTimeCtrl.value.valueOf() : null,
        version: this.viewVersion,
        keyword: this.keywordCtrl.value,
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

        this.executionlogsService.updateDataLogs(this.curLogs);
        this.executionlogsService.updateNextCursorRunning(logs.nextCursor);
      });
  }
}
