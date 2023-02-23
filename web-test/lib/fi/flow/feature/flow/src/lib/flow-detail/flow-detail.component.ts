import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSidenav } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Action,
  ActionDef,
  ActionType,
  Breadcrumb,
  Connector,
  ConnectorReq,
  ConnectorService,
  DataSourceService,
  Flow,
  FlowQuery,
  FlowService,
  GetActionReq,
  PrerequisiteService,
  SimpleAppFlowService,
  SubroutineService,
  Trigger,
  TriggerQuery,
  TriggerService,
  UserQuery
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest, forkJoin, Observable } from 'rxjs';
import { filter, take, takeUntil } from 'rxjs/operators';
import {
  ReplaceTriggerDialogComponent,
  ReplaceTriggerDialogReq
} from '../replace-trigger-dialog/replace-trigger-dialog.component';
import { AddActionDialogComponent, OpenAddActionDialogReq } from './add-action-dialog/add-action-dialog.component';
import { UpdateBaCreatorDialogComponent } from './update-bacreator-dialog/update-bacreator-dialog.component';
import { UpdateSubroutineDialogComponent } from './update-subroutine-dialog/update-subroutine-dialog.component';
import { UpdateTriggerDialogComponent } from './update-trigger-dialog/update-trigger-dialog.component';
import {
  ViewTriggerOutputDialogComponent,
  ViewTriggerOutputDialogInput
} from './view-trigger-output-dialog/view-trigger-output-dialog.component';

@Component({
  selector: 'b3n-flow-detail',
  templateUrl: './flow-detail.component.html',
  styleUrls: ['./flow-detail.component.scss']
})
export class FlowDetailComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav: MatSidenav;

  showForApp: string;
  AppName = AppName;

  flow$: Observable<Flow>;
  trigger: Trigger;
  callers: Flow[] = [];
  paramsReq: GetActionReq;
  isMainFlow: boolean;
  showListAction: boolean;
  resizableMinWidth = 348;
  connectorSelected: Connector;
  isOpenOverviewTree: boolean;

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
    private toastService: ToastService,
    private flowQuery: FlowQuery,
    private flowService: FlowService,
    private subroutineService: SubroutineService,
    private triggerService: TriggerService,
    private triggerQuery: TriggerQuery,
    private prerequisiteService: PrerequisiteService,
    private simpleAppFlowService: SimpleAppFlowService,
    private connectorService: ConnectorService,
    private dataSourceService: DataSourceService,
    private userQuery: UserQuery,
    private appStateQuery: AppStateQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
    this.prerequisiteService.getPrerequisites().subscribe();
    this.flow$ = this.flowQuery.select();

    this.flowQuery
      .select()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(flow => !!flow.uuid),
        take(1)
      )
      .subscribe(flow => {
        if (flow.type === 'SUBROUTINE') {
          this.subroutineService.getCallers(flow.uuid).subscribe(res => {
            this.callers = res;
          });
        }

        const req = <ConnectorReq>{
          flowUuid: flow.uuid,
          flowVersion: flow.version
        };
        this.connectorService.getConnectors(req, this.showForApp == AppName.PROGRAMMABLE_FLOW).subscribe();
      });

    this.flowQuery
      .select(flow => flow.ui.treeNodeSelected)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(node => node?.isShowEditDialog)
      )
      .subscribe(treeNodeSelected => {
        switch (treeNodeSelected.nodeType) {
          case 'NORMAL_TRIGGER':
            this.edit('NORMAL');
            break;
          case 'SUBROUTINE_TRIGGER':
            this.edit('SUBROUTINE');
            break;
          case 'BUSINESS_ACTION_TRIGGER':
            this.edit('BUSINESS_ACTION');
            break;
        }
      });

    this.triggerQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(trigger => {
        this.trigger = trigger;
      });

    combineLatest([this.route.params, this.route.queryParams]).subscribe(([params, queryParams]) => {
      this.paramsReq = <GetActionReq>{
        flowUuid: params['flowUuid'],
        version: params['version'],
        actionUuid: queryParams['actionUuid'],
        pathId: queryParams['pathId']
      };

      if (this.paramsReq.actionUuid && this.paramsReq.pathId) {
        this.isMainFlow = false;
        this.flowService.getBreadcrumb(this.paramsReq).subscribe(breadcrumbs => {
          const activePath = breadcrumbs[breadcrumbs.length - 1].paths.find(p => p.isCurrent);
          if (activePath.nextActionUuid) {
            this.showListAction = true;
          } else {
            this.showListAction = false;
          }
        });
        this.getActions();
      } else {
        this.isMainFlow = true;
        this.triggerService.getTrigger(params['flowUuid'], params['version']).subscribe(() => {
          this.getActions();
        });
      }
    });
  }

  override ngOnDestroy() {
    super.ngOnDestroy();
    this.dataSourceService.reset();
    this.unSelectedActionNode();
  }

  getActions() {
    if (this.appStateQuery.getName() === AppName.PROGRAMMABLE_FLOW) {
      this.simpleAppFlowService.getActions(this.paramsReq).subscribe();
    } else {
      this.flowService.getActions(this.paramsReq).subscribe();
    }
  }

  edit(type: 'NORMAL' | 'SUBROUTINE' | 'BUSINESS_ACTION') {
    switch (type) {
      case 'NORMAL':
        this.dialog.open(UpdateTriggerDialogComponent, {
          width: '700px',
          panelClass: 'fif-dialog',
          disableClose: true,
          autoFocus: false
        });
        break;
      case 'SUBROUTINE':
        this.dialog.open(UpdateSubroutineDialogComponent, {
          width: '700px',
          panelClass: 'fif-dialog',
          disableClose: true,
          autoFocus: false
        });
        break;
      case 'BUSINESS_ACTION':
        this.dialog.open(UpdateBaCreatorDialogComponent, {
          width: '700px',
          panelClass: 'fif-dialog',
          disableClose: true,
          autoFocus: false
        });
        break;
    }
  }

  viewTriggerOutput(flow: Flow) {
    let data;
    switch (flow.type) {
      case 'NORMAL':
        data = this.trigger.outputs;
        break;
      case 'SUBROUTINE':
        data = [...flow.subroutineInput.parameters] ?? [];
        data.push({
          title: 'Event Time',
          dataType: 'number',
          description: 'Timestamp that the event happens'
        });
        break;
    }
    this.dialog.open(ViewTriggerOutputDialogComponent, {
      width: '500px',
      panelClass: 'fif-dialog',
      disableClose: true,
      data: <ViewTriggerOutputDialogInput>{ type: flow.type, data: data }
    });
  }

  goToFlow(flow: Flow) {
    this.flowService.getFlowDetail({ flowUuid: flow.uuid, version: flow.version }).subscribe(() => {
      this.router.navigate([flow.uuid, flow.version], {
        relativeTo: this.route.parent
      });
    });
  }

  replaceTrigger(flow: Flow) {
    this.dialog
      .open(ReplaceTriggerDialogComponent, {
        width: '1200px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <ReplaceTriggerDialogReq>{
          isDeprecated: false,
          replace: true,
          isTrigger: true
        }
      })
      .afterClosed()
      .subscribe(success => {
        if (success) {
          forkJoin([
            this.flowService.getFlowDetail(this.paramsReq),
            this.triggerService.getTrigger(this.paramsReq.flowUuid, this.paramsReq.version),
            this.flowService.getMenuTree(flow?.uuid, flow?.version)
          ]).subscribe(() => {
            this.getActions();
          });
        }
      });
  }

  onNavigateToResolveDeprecate(flow: Flow) {
    if (!flow.editable) {
      this.dialog
        .open(ConfirmDialogComponent, {
          width: '500px',
          panelClass: 'fif-dialog',
          data: <ConfirmDialogInput>{
            title: 'Resolve Issues',
            message: `You must create a new version of this flow. Do you want to create a new version of this flow?<br/><br/>
                  <strong>*Note:</strong> The current version will continue running until the new one is activated`,
            color: 'warn'
          }
        })
        .afterClosed()
        .subscribe(confirm => {
          if (confirm) {
            this.flowService.createNewVersion({ flowUuid: flow.uuid, version: flow.version }).subscribe({
              next: newFlow => {
                this.toastService.success(`A new version of the flow has been created`);
                this.router.navigate([newFlow.uuid, newFlow.version, 'resolve-deprecated'], {
                  relativeTo: this.route.parent
                });
              },
              error: error => this.toastService.error(error.message)
            });
          }
        });
    } else {
      this.router.navigate([flow.uuid, flow.version, 'resolve-deprecated'], { relativeTo: this.route.parent });
    }
  }

  // Function of action detail
  private getCurrentBreadcrumb(flow: Flow): Breadcrumb {
    if (flow.ui.breadcrumb) {
      return flow.ui.breadcrumb[flow.ui.breadcrumb.length - 1];
    }
    return null;
  }

  getActionNameOfPath(flow: Flow) {
    const br = this.getCurrentBreadcrumb(flow);
    if (br) {
      const path = br.paths.find(p => p.pathId === this.paramsReq.pathId);
      if (path) {
        return `${path.number}. ${br.actionName}: ${path.pathName}`;
      }
    }
    return '';
  }

  toggleOverViewTree() {
    this.isOpenOverviewTree = !this.isOpenOverviewTree;
    const overViewTree = document.getElementById('side-nav-overview-tree');
    if (overViewTree) {
      overViewTree.style.width = 'auto';
    }
  }

  isShowAddAction(flow: Flow, actionUuid: 'PATH_ID' | 'TRIGGER_ID') {
    if (!flow.editable) {
      return false;
    }

    if (flow.ui.actionSelected) {
      if (flow.ui.actionSelected && flow.ui.actionSelected?.actionUuid !== actionUuid) {
        return false;
      }
    } else {
      if (this.connectorSelected) {
        if (flow.ui.actions?.length) {
          if (this.connectorSelected.actionDefs[0]?.uuid === ActionType.SUBROUTINE_RETURN) {
            return false;
          }
        }
      }
    }

    return true;
  }

  onSelectActionNodeFromPreviousAction(flow: Flow) {
    if (
      this.showForApp !== AppName.PROGRAMMABLE_FLOW ||
      (this.showForApp === AppName.PROGRAMMABLE_FLOW && this.checkLimitResource(flow))
    ) {
      this.flowService.setActionSelected(<Action>{
        actionUuid: 'PATH_ID'
      });

      if (!this.connectorSelected) {
        return;
      }
      this.addActionFromActionPrevious(flow);
    }
  }

  onSelectedActionNodeOfTrigger(flow: Flow) {
    if (
      this.showForApp !== AppName.PROGRAMMABLE_FLOW ||
      (this.showForApp === AppName.PROGRAMMABLE_FLOW && this.checkLimitResource(flow))
    ) {
      this.flowService.setActionSelected(<Action>{
        actionUuid: 'TRIGGER_ID'
      });

      if (!this.connectorSelected) {
        return;
      }
      this.addActionFromTrigger(flow);
    }
  }

  selectConnector(connector: Connector, flow: Flow) {
    this.connectorSelected = connector;
    if (!this.connectorSelected || !flow.ui.actionSelected) {
      return;
    }

    if (flow.ui.actionSelected?.actionUuid === 'TRIGGER_ID') {
      this.addActionFromTrigger(flow);
      return;
    }
    if (flow.ui.actionSelected?.actionUuid === 'PATH_ID') {
      this.addActionFromActionPrevious(flow);
      return;
    }
    this.addActionFromListAction(flow, flow.ui.actionSelected);
  }

  selectCustomAction(flow: Flow) {
    const connectorDefault = new Connector({
      actionDefs: [
        <ActionDef>{
          uuid: ActionType.EXTERNAL,
          name: 'External Action',
          outputs: [],
          description: ''
        }
      ]
    });
    this.selectConnector(connectorDefault, flow);
  }

  onAddAction(action: Action, flow: Flow) {
    if (!this.connectorSelected || !action) {
      return;
    }

    this.addActionFromListAction(flow, action);
  }

  unSelectedActionNode() {
    this.flowService.setActionSelected(null);
    this.connectorService.resetUI();
  }

  private checkLimitResource(flow: Flow): boolean {
    const maxActionsPerFlow = this.userQuery.getValue().actionsPerFlowLimit;
    if (!maxActionsPerFlow) {
      return true;
    } else {
      if (flow.ui.totalActions > maxActionsPerFlow) {
        this.dialog.open(ConfirmDialogComponent, {
          width: '500px',
          data: <ConfirmDialogInput>{
            title: `Unable to add action. Limit exceeded`,
            message: `You have exceeded the maximum ${maxActionsPerFlow} actions per flow limit. Please remove some other actions to proceed.`,
            confirmLabel: 'Close',
            color: 'primary',
            hideCancel: true
          }
        });
        return false;
      } else {
        return true;
      }
    }
  }

  private addActionFromTrigger(flow: Flow) {
    this.dialog
      .open(AddActionDialogComponent, {
        width: '700px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <OpenAddActionDialogReq>{
          prevActionUuid: null,
          prevActionPathId: null,
          connectorSelected: this.connectorSelected
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.unSelectedActionNode();
          this.getActions();
          this.flowService.getMenuTree(flow?.uuid, flow?.version).subscribe();
        }
      });
  }

  private addActionFromActionPrevious(flow: Flow) {
    const br = this.getCurrentBreadcrumb(flow);
    if (!br) {
      return;
    }

    this.dialog
      .open(AddActionDialogComponent, {
        width: '700px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <OpenAddActionDialogReq>{
          prevActionUuid: br.actionUuid,
          prevActionPathId: this.paramsReq.pathId,
          connectorSelected: this.connectorSelected
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.unSelectedActionNode();
          this.router.navigate([flow.uuid, flow.version], {
            relativeTo: this.route.parent,
            queryParams: { actionUuid: res.uuid, pathId: this.paramsReq.pathId }
          });
          this.flowService.getMenuTree(flow?.uuid, flow?.version).subscribe();
        }
      });
  }

  private addActionFromListAction(flow: Flow, action: Action) {
    this.dialog
      .open(AddActionDialogComponent, {
        width: '700px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <OpenAddActionDialogReq>{
          prevActionUuid: action.actionUuid,
          prevActionPathId: null,
          connectorSelected: this.connectorSelected
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.unSelectedActionNode();
          this.getActions();
          this.flowService.getMenuTree(flow?.uuid, flow?.version).subscribe();
        }
      });
  }
}
