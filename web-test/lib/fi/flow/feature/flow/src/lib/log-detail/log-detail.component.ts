import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatAccordion } from '@angular/material/expansion';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionLog, ExecutionLog, ExecutionLogsService, MainFlowInfo, ViewDetailReq } from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-log-detail',
  templateUrl: './log-detail.component.html',
  styleUrls: ['./log-detail.component.scss']
})
export class LogDetailComponent implements OnInit, OnDestroy {
  @ViewChild('accordion') accordion: MatAccordion;
  @Input() executionId: number;

  showForApp: string;
  AppName = AppName;

  paramsReq: ViewDetailReq;
  log: ExecutionLog;
  expanded = false;
  displayedColumns = ['title', 'value'];
  tab: string;
  autoReload;
  gettingLog: boolean;
  actionUuid(_, item) {
    return item.actionUuid;
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private appStateQuery: AppStateQuery,
    private executionlogsService: ExecutionLogsService,
    private toastr: ToastService
  ) {}

  ngOnInit() {
    this.showForApp = this.appStateQuery.getName();
    this.route.params.subscribe(params => {
      if (this.executionId) {
        this.paramsReq = <ViewDetailReq>{
          flowUuid: params['flowUuid'],
          id: this.executionId
        };
        this.getLogsForTesting();
        this.setAutoRefresh();
      } else {
        this.paramsReq = <ViewDetailReq>{
          flowUuid: params['flowUuid'],
          id: params['id']
        };
        this.tab = params['tab'];
        this.getLogs();
      }
    });
  }

  ngOnDestroy(): void {
    clearInterval(this.autoReload);
  }

  refresh() {
    clearInterval(this.autoReload);
    this.setAutoRefresh();
  }

  private setAutoRefresh() {
    this.gettingLog = true;
    this.autoReload = setInterval(() => {
      this.getLogsForTesting();
    }, 5000);
  }

  getLogs() {
    switch (this.tab) {
      case 'done':
      case 'success':
        this.executionlogsService.getExecutionLogsDoneDetail(this.paramsReq).subscribe(log => {
          this.log = log;
        });
        break;
      default:
        this.executionlogsService.getExecutionLogsRunningDetail(this.paramsReq).subscribe(log => {
          this.log = log;
        });
        break;
    }
  }

  private getLogsForTesting() {
    this.executionlogsService.getExecutionLogsRunningDetail(this.paramsReq).subscribe(log => {
      this.log = log;
      if (log.status == 'success' || log.status == 'failed') {
        this.gettingLog = false;
        clearInterval(this.autoReload);
      }
    });
  }

  copied() {
    this.toastr.success('Copied to clipboard');
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
    switch (this.showForApp) {
      case AppName.FLOW:
        if (location.hostname == 'localhost') {
          window.open(url, '_blank');
        } else {
          window.open(`${location.origin}/#/${X.orgUuid}/Flow?redirect=${url}`, '_blank');
        }
        break;
      case AppName.BUSINESS_ACTION_CREATOR:
        if (location.hostname == 'localhost') {
          window.open(url, '_blank');
        } else {
          window.open(`${location.origin}/#/${X.orgUuid}/BusinessActionCreator?redirect=${url}`, '_blank');
        }
        break;
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
      this.router.createUrlTree([params.flowUuid, params.flowVersion, 'logs', params.executionId, actionLog.state], {
        relativeTo: this.route.parent
      })
    );
    this.openNewTab(url);
  }

  viewLogMainFlow() {
    const mainFlowInfo = this.log.mainFlowInfo;
    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        [mainFlowInfo.flowUuid, mainFlowInfo.flowVersion, 'logs', mainFlowInfo.executionId, this.log.status],
        {
          relativeTo: this.route.parent
        }
      )
    );
    this.openNewTab(url);
  }
}
