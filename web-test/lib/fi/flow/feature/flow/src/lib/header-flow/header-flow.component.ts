import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ExecutionLogsService,
  Flow,
  FlowActionReq,
  FlowQuery,
  FlowService,
  GetLogsReq,
  MapEventQuery,
  SimpleAppFlowService,
  TriggerQuery
} from '@b3networks/api/flow';
import { AppName, AppStateQuery, RenameFlowDialogComponent, RenameFlowDialogReq } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent, downloadData } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { Observable } from 'rxjs';
import { finalize, takeUntil, tap } from 'rxjs/operators';

export type SOURCE_PAGE =
  | 'flow'
  | 'logs'
  | 'log-detail'
  | 'resolve-deprecated'
  | 'flow-testing'
  | 'mapped-events'
  | 'config-event';

@Component({
  selector: 'b3n-header-flow',
  templateUrl: './header-flow.component.html',
  styleUrls: ['./header-flow.component.scss']
})
export class HeaderFlowComponent extends DestroySubscriberComponent implements OnInit {
  @Input() fromPage: SOURCE_PAGE;
  @Output() toggle = new EventEmitter<void>();

  allowDeployFlow: boolean;
  flow$: Observable<Flow>;

  showConfiguration: boolean;
  showLog: boolean;
  showLogDetail: boolean;
  showResolveDeprecated: boolean;
  showFlowTesting: boolean;
  showMappedEvents: boolean;
  showConfigEvent: boolean;

  showForApp: string;
  AppName = AppName;
  deploying: boolean;
  creatingNewVersion: boolean;
  archiving: boolean;
  logId: string;
  eventName: string;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private flowQuery: FlowQuery,
    private flowService: FlowService,
    private simpleAppService: SimpleAppFlowService,
    private executionlogsService: ExecutionLogsService,
    private triggerQuery: TriggerQuery,
    private appStateQuery: AppStateQuery,
    private mapEventQuery: MapEventQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();

    this.flow$ = this.flowQuery.select().pipe(
      tap(flow => {
        switch (flow.type) {
          case 'NORMAL':
            this.allowDeployFlow = this.triggerQuery.getValue().configs && flow.ui.actions.length > 0;
            break;
          case 'SUBROUTINE':
          case 'BUSINESS_ACTION':
            this.allowDeployFlow = flow.ui.actions.length > 0;
            break;
        }
      })
    );

    this.route.params.subscribe(params => {
      const param: FlowActionReq = {
        flowUuid: params['flowUuid'],
        version: Number(params['version'])
      };
      const flow = this.flowQuery.getValue();
      if (
        !flow.uuid ||
        (flow.uuid &&
          (flow.uuid !== param.flowUuid || (flow.uuid === param.flowUuid && flow.version !== param.version)))
      ) {
        this.flowService.getFlowDetail(param).subscribe();
      }

      switch (this.fromPage) {
        case 'flow':
          this.showConfiguration = true;
          this.executionlogsService.reset();
          break;
        case 'logs':
          this.showLog = true;
          break;
        case 'log-detail':
          this.showLogDetail = true;
          this.logId = params['id'];
          break;
        case 'resolve-deprecated':
          this.showResolveDeprecated = true;
          this.executionlogsService.reset();
          break;
        case 'flow-testing':
          this.showFlowTesting = true;
          break;
        case 'mapped-events':
          this.showMappedEvents = true;
          this.executionlogsService.reset();
          break;
        case 'config-event':
          this.showConfigEvent = true;
          this.executionlogsService.reset();
          if (Number(params['id']) > 0) {
            this.mapEventQuery
              .select()
              .pipe(takeUntil(this.destroySubscriber$))
              .subscribe(mapEvent => {
                const triggerDef = mapEvent.triggerDef;
                this.eventName = `${triggerDef.name} (v${mapEvent.latestVersion})`;
              });
          } else {
            this.eventName = `Map New Event`;
          }
          break;
      }
    });
  }

  deploy(flow: Flow) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        data: <ConfirmDialogInput>{
          title: 'Deploy flow',
          message: `Are you sure you want to deploy this flow?`,
          color: 'primary'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.deploying = true;
          this.flowService
            .deployFlow(
              <FlowActionReq>{ flowUuid: flow.uuid, version: flow.version },
              this.showForApp === AppName.PROGRAMMABLE_FLOW
            )
            .pipe(finalize(() => (this.deploying = false)))
            .subscribe({
              next: () => this.toastService.success(`Flow has been activated`),
              error: err => this.toastService.error(`Activation failed: ${err.message}`)
            });
        }
      });
  }

  rename(flow: Flow) {
    this.dialog.open(RenameFlowDialogComponent, {
      width: '400px',
      panelClass: 'fif-dialog',
      disableClose: true,
      data: <RenameFlowDialogReq>{
        uuid: flow.uuid,
        version: flow.version,
        name: flow.name,
        type: flow.type,
        presentName: flow.presentName
      }
    });
  }

  createNewVersion(flow: Flow) {
    let data: ConfirmDialogInput;

    if (!flow.isArchived) {
      data = <ConfirmDialogInput>{
        title: 'Edit flow',
        message: `To edit, a new version of the flow will be created. Do you want to create a new version of this flow?<br/><br/>
                  <strong>Note:</strong> The current version will continue running until the new one is activated`,
        color: 'warn'
      };
    } else {
      data = <ConfirmDialogInput>{
        title: 'Unarchive flow',
        message: `A new version of this flow will be created. Do you want to continue?`,
        color: 'warn'
      };
    }

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        data: data
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.creatingNewVersion = true;
          this.flowService
            .createNewVersion(<FlowActionReq>{ flowUuid: flow.uuid, version: flow.version })
            .pipe(finalize(() => (this.creatingNewVersion = false)))
            .subscribe({
              next: flow => {
                this.toastService.success(`A new version of the flow has been created`);
                this.goBack(flow);
              },
              error: err => this.toastService.error(err.message)
            });
        }
      });
  }

  archive(flow: Flow) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        data: <ConfirmDialogInput>{
          title: 'Archive flow',
          message: `Are you sure to archive this flow?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.archiving = true;
          this.flowService
            .archiveFlow(<FlowActionReq>{ flowUuid: flow.uuid, version: flow.version })
            .pipe(finalize(() => (this.archiving = false)))
            .subscribe({
              next: () => {
                this.toastService.success(`Flow has archived`);
                this.goToHome(flow);
              },
              error: err => this.toastService.error(`Archive failed: ${err.message}`)
            });
        }
      });
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }

  export(flow: Flow) {
    this.flowService.exportFlow({ appOrigin: this.showForApp, uuid: flow.uuid, version: flow.version }).subscribe({
      next: res => {
        const blob = new Blob([JSON.stringify(res)], { type: 'text/plain' });
        const time = format(new Date(res.exportedDate), 'yyyyMMdd_HHmm');
        downloadData(blob, `${flow.name}-${time}.json`);
      },
      error: err => this.toastService.error(err.message)
    });
  }

  toggleSidebar() {
    this.toggle.emit();
    this.flowService.resetTreeNodeSelected();
  }

  goBack(flow: Flow) {
    this.goToVersion(flow, flow.version);
  }

  goToVersion(flow: Flow, version: number) {
    this.router.navigate(['../flow', flow.uuid, version], { relativeTo: this.route.parent });
  }

  goToMappedEvents(flow: Flow) {
    this.router.navigate(['../flow', flow.uuid, flow.version, 'mapped-events'], {
      relativeTo: this.route.parent
    });
  }

  goToConfigEvent(flow: Flow) {
    this.router.navigate(['../flow', flow.uuid, flow.version, 'mapped-events', 0], {
      relativeTo: this.route.parent
    });
  }

  goToLogs(flow: Flow) {
    switch (this.showForApp) {
      case AppName.FLOW:
      case AppName.BUSINESS_ACTION_CREATOR:
        this.router.navigate(['../flow', flow.uuid, flow.version, 'logs'], {
          relativeTo: this.route.parent
        });
        break;
      case AppName.PROGRAMMABLE_FLOW:
        this.simpleAppService.resetLog();
        this.simpleAppService.paramsForGetLogs(<GetLogsReq>{ flowUuid: flow.uuid, version: flow.version });
        this.router.navigate(['../log'], { relativeTo: this.route.parent });
        break;
    }
  }

  goToFlowTesting(flow: Flow) {
    this.router.navigate(['../flow', flow.uuid, flow.version, 'flow-testing'], {
      relativeTo: this.route.parent
    });
  }

  goToHome(flow: Flow) {
    switch (this.showForApp) {
      case AppName.FLOW:
      case AppName.PROGRAMMABLE_FLOW:
        this.router.navigate(['../flow'], {
          relativeTo: this.route.parent,
          queryParams: { tab: flow.isArchived ? 'archived' : null }
        });
        break;
      case AppName.BUSINESS_ACTION_CREATOR:
        this.router.navigate(['../flow'], { relativeTo: this.route.parent });
        break;
    }
  }
}
