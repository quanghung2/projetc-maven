import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionLog, ExecutionLog, ExecutionLogsService, MainFlowInfo, ViewDetailReq } from '@b3networks/api/flow';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-log-detail',
  templateUrl: './log-detail.component.html',
  styleUrls: ['./log-detail.component.scss']
})
export class LogDetailComponent implements OnInit {
  @ViewChild('accordion') accordion: MatAccordion;
  @Input() viewDetailReq: ViewDetailReq;
  @Output() back = new EventEmitter<void>();

  showViewAllLog = false;
  log: ExecutionLog;
  expanded = false;
  displayedColumns = ['title', 'value'];
  actionUuid(_, item) {
    return item.actionUuid;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private executionlogsService: ExecutionLogsService,
    private toastr: ToastService
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.params;
    if (params['flowUuid'] && params['version'] && params['id']) {
      this.showViewAllLog = true;
    }
    this.getLogs();
  }

  viewAllLog() {
    this.router.navigateByUrl(this.router.url.split('log')[0] + 'log');
  }

  copied() {
    this.toastr.success('Copied to clipboard');
  }

  getLogs() {
    switch (this.viewDetailReq.tab) {
      case 'done':
      case 'success':
        this.executionlogsService.getExecutionLogsDoneDetail(this.viewDetailReq).subscribe(log => {
          this.log = log;
        });
        break;
      default:
        this.executionlogsService.getExecutionLogsRunningDetail(this.viewDetailReq).subscribe(log => {
          this.log = log;
        });
        break;
    }
  }

  expandAll() {
    this.accordion.openAll();
    this.expanded = true;
  }

  collapseAll() {
    this.accordion.closeAll();
    this.expanded = false;
  }

  private openNewTab(url: string) {
    if (location.hostname == 'localhost') {
      window.open(`${location.origin}/#${url}`, '_blank');
    } else {
      window.open(`${location.origin}/#/${X.orgUuid}/DeveloperHub?redirect=${url}`, '_blank');
    }
  }

  navigateToSubroutine(actionLog: ActionLog) {
    let params: MainFlowInfo;
    if (actionLog.nestedExecutionInfo) {
      params = actionLog.nestedExecutionInfo;
    } else {
      params = {
        flowUuid: actionLog.subroutineUuid,
        flowVersion: actionLog.subroutineVersion,
        executionId: actionLog.subroutineExecutionId
      };
    }

    const url = this.router.serializeUrl(
      this.router.createUrlTree([params.flowUuid, params.flowVersion, params.executionId], {
        relativeTo: this.route.parent
      })
    );
    this.openNewTab(url);
  }

  viewLogMainFlow() {
    const mainFlowInfo = this.log.mainFlowInfo;
    const url = this.router.serializeUrl(
      this.router.createUrlTree([mainFlowInfo.flowUuid, mainFlowInfo.flowVersion, mainFlowInfo.executionId], {
        relativeTo: this.route.parent
      })
    );
    this.openNewTab(url);
  }
}
