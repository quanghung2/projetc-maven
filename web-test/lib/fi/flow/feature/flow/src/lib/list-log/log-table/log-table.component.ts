import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ExecutionLog, GroupByLog } from '@b3networks/api/flow';
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
  readonly displayedColumns = ['id', 'startTime', 'endTime', 'version', 'status'];
  @Input() dataSource: (ExecutionLog | GroupByLog)[] = [];
  @Output() onLoadMore = new EventEmitter<TypeLoadMore>();

  constructor(private toastr: ToastService, private activatedRoute: ActivatedRoute, private router: Router) {}

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
    this.router.navigate([e.flowUuid, e.version, 'logs', e.id, e.type.toLowerCase()], {
      relativeTo: this.activatedRoute.parent
    });
  }

  getLogs(e: GroupByLog) {
    this.onLoadMore.emit(<TypeLoadMore>{
      isLogRunning: e.type === 'RUNNING',
      isLogDone: e.type === 'DONE'
    });
  }
}
