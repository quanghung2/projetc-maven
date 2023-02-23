import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ExecutionLog, GroupByLog, ViewDetailReq } from '@b3networks/api/flow';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface TypeLoadMore {
  isLogRunning: boolean;
  isLogDone: boolean;
}

@Component({
  selector: 'b3n-log-table',
  templateUrl: './log-table.component.html',
  styleUrls: ['./log-table.component.scss']
})
export class LogTableComponent {
  readonly displayedColumns = ['id', 'flowName', 'version', 'startTime', 'endTime', 'status'];
  @Input() dataSource: (ExecutionLog | GroupByLog)[] = [];
  @Output() loadMore = new EventEmitter<TypeLoadMore>();
  @Output() viewDetail = new EventEmitter<ViewDetailReq>();

  constructor(private toastr: ToastService) {}

  isGroup(index, item: GroupByLog): boolean {
    return item.isGroupBy;
  }

  isNextCursor(index, item: GroupByLog): boolean {
    return item.isNextCursor;
  }

  copied() {
    this.toastr.success('Copied to clipboard');
  }

  viewLog(e: ExecutionLog) {
    this.viewDetail.emit({
      flowUuid: e.flowUuid,
      flowName: e.flowName,
      version: e.version,
      id: e.id,
      tab: e.type?.toLowerCase()
    });
  }

  getLogs(e: GroupByLog) {
    this.loadMore.emit(<TypeLoadMore>{
      isLogRunning: e.type === 'RUNNING',
      isLogDone: e.type === 'DONE'
    });
  }
}
