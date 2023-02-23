import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Action,
  ActionDef,
  ActionsService,
  ActionType,
  Connector,
  ConnectorService,
  DeleteActionReq,
  DependencyAction,
  Flow,
  FlowQuery,
  FlowService,
  Path,
  PrerequisiteQuery,
  PropertyForVariable,
  ReplaceActionReq,
  ResolveDependencyInput,
  TreeNode,
  UserQuery
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { distinct, filter, finalize, skip, takeUntil, tap } from 'rxjs/operators';
import {
  ConfirmDeleteActionDialog,
  ConfirmDeleteActionDialogComponent,
  ConfirmDeleteOuput
} from '../confirm-delete-action-dialog/confirm-delete-action-dialog.component';
import { ReplaceActionDialogComponent } from '../replace-action-dialog/replace-action-dialog.component';
import { ResolveDependencyDialogComponent } from '../resolve-dependency-dialog/resolve-dependency-dialog.component';
import { ResolveDependencyOutput } from '../resolve-dependency/resolve-dependency.component';
import { SelectPathDialogComponent, SelectPathInput } from '../select-path-dialog/select-path-dialog.component';
import { UpdateActionApiDialogComponent } from './update-action-api-dialog/update-action-api-dialog.component';
import { UpdateActionDefineConstantDialogComponent } from './update-action-define-constant-dialog/update-action-define-constant-dialog.component';
import { UpdateActionExternalDialogComponent } from './update-action-external-dialog/update-action-external-dialog.component';
import { UpdateActionLoopingDialogComponent } from './update-action-looping-dialog/update-action-looping-dialog.component';
import { UpdateActionSharedVariableDialogComponent } from './update-action-shared-variable-dialog/update-action-shared-variable-dialog.component';
import { UpdateActionSubroutineCallDialogComponent } from './update-action-subroutine-call-dialog/update-action-subroutine-call-dialog.component';
import { UpdateActionSubroutineReturnDialogComponent } from './update-action-subroutine-return-dialog/update-action-subroutine-return-dialog.component';
import { UpdateActionSwitchingDialogComponent } from './update-action-switching-dialog/update-action-switching-dialog.component';
import { UpdateActionTransformDialogComponent } from './update-action-transform-dialog/update-action-transform-dialog.component';
import { ViewOutputActionDialogComponent } from './view-output-action-dialog/view-output-action-dialog.component';

@Component({
  selector: 'b3n-list-action',
  templateUrl: './list-action.component.html',
  styleUrls: ['./list-action.component.scss']
})
export class ListActionComponent extends DestroySubscriberComponent implements OnInit {
  @Input() pathId: string;
  @Input() connectorSelected: Connector;
  @Output() reloadActions = new EventEmitter<void>();
  @Output() onAddAction = new EventEmitter<Action>();
  @Output() selectedAction = new EventEmitter<Connector>();

  showForApp: string;
  AppName = AppName;

  flow$: Observable<Flow>;
  ActionType = ActionType;
  deleting: boolean;
  dependencyAction: DependencyAction[];
  nextPathId: string;
  actionUuid: string;
  replaceActionData: ReplaceActionReq;
  invalidConnectors: string[];

  trackByUuid(_, item: Action) {
    return item.actionUuid;
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private flowQuery: FlowQuery,
    private flowService: FlowService,
    private connectorService: ConnectorService,
    private actionsService: ActionsService,
    private userQuery: UserQuery,
    private prerequisiteQuery: PrerequisiteQuery,
    private appStateQuery: AppStateQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();

    this.flow$ = this.flowQuery.select();

    this.flowQuery
      .select(flow => flow.ui.treeNodeSelected)
      .pipe(
        distinct(),
        skip(1),
        takeUntil(this.destroySubscriber$),
        filter(node => !!node),
        tap(node => {
          this.goToAction(node);
        })
      )
      .subscribe();

    this.prerequisiteQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.invalidConnectors = res.invalidConnectors;
      });
  }

  showWarning(connectorUuid: string) {
    return this.invalidConnectors?.includes(connectorUuid);
  }

  getIcon(action: Action) {
    const iconUrl = 'assets/flow-shared/icons';
    switch (action.type) {
      case ActionType.EXTERNAL:
        return `${iconUrl}/api.svg`;
      case ActionType.DEFINE_CONSTANTS:
        return `${iconUrl}/library_add.svg`;
      case ActionType.LOOPING_ACTION:
        return `${iconUrl}/repeat.svg`;
      case ActionType.SET_SHARED_VARIABLE:
        return `${iconUrl}/upload.svg`;
      case ActionType.GET_SHARED_VARIABLE:
        return `${iconUrl}/download.svg`;
      case ActionType.INCREMENT_SHARED_VARIABLE:
        return `${iconUrl}/plus_one.svg`;
      case ActionType.PUSH_SHARED_VARIABLE:
        return `${iconUrl}/playlist_add.svg`;
      case ActionType.POP_SHARED_VARIABLE:
        return `${iconUrl}/playlist_remove.svg`;
      case ActionType.SUBROUTINE_RETURN:
        return `${iconUrl}/keyboard_return.svg`;
      case ActionType.SWITCHING:
        return `${iconUrl}/brandching.svg`;
      case ActionType.TRANSFORM:
        return `${iconUrl}/transform.svg`;
      case ActionType.API:
      case ActionType.SUBROUTINE_CALL:
        return action.actionDef?.iconUrl;
    }
    return '';
  }

  editAction(flow: Flow, action: Action) {
    let dialogUpdateAction;
    const config = <MatDialogConfig>{
      width: '800px',
      disableClose: true,
      autoFocus: false,
      panelClass: 'fif-dialog',
      data: action
    };

    switch (action.type) {
      case ActionType.API:
        dialogUpdateAction = this.dialog.open(UpdateActionApiDialogComponent, config);
        break;
      case ActionType.SUBROUTINE_RETURN:
        dialogUpdateAction = this.dialog.open(UpdateActionSubroutineReturnDialogComponent, config);
        break;
      case ActionType.SUBROUTINE_CALL:
        dialogUpdateAction = this.dialog.open(UpdateActionSubroutineCallDialogComponent, config);
        break;
      case ActionType.SWITCHING:
        dialogUpdateAction = this.dialog.open(UpdateActionSwitchingDialogComponent, config);
        break;
      case ActionType.TRANSFORM:
        dialogUpdateAction = this.dialog.open(UpdateActionTransformDialogComponent, config);
        break;
      case ActionType.DEFINE_CONSTANTS:
        dialogUpdateAction = this.dialog.open(UpdateActionDefineConstantDialogComponent, config);
        break;
      case ActionType.EXTERNAL:
        dialogUpdateAction = this.dialog.open(UpdateActionExternalDialogComponent, config);
        break;
      case ActionType.LOOPING_ACTION:
        dialogUpdateAction = this.dialog.open(UpdateActionLoopingDialogComponent, config);
        break;
      case ActionType.SET_SHARED_VARIABLE:
      case ActionType.GET_SHARED_VARIABLE:
      case ActionType.PUSH_SHARED_VARIABLE:
      case ActionType.POP_SHARED_VARIABLE:
      case ActionType.INCREMENT_SHARED_VARIABLE:
        dialogUpdateAction = this.dialog.open(UpdateActionSharedVariableDialogComponent, config);
        break;
    }

    dialogUpdateAction?.afterClosed().subscribe(res => {
      if (res) {
        this.reloadActions.emit();
        this.flowService.getMenuTree(flow?.uuid, flow?.version).subscribe();
      }
      this.flowService.resetTreeNodeSelected();
    });
  }

  viewOutput(action: Action) {
    this.dialog.open(ViewOutputActionDialogComponent, {
      width: '600px',
      panelClass: 'fif-dialog',
      data: action
    });
  }

  goToFlow(action: Action) {
    this.connectorService
      .getActionDefs(action.actionDef.connectorUuid)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(actionDefs => {
        const actionDef = actionDefs.find(a => a.uuid === action.actionDef.actionDefUuid);
        this.flowService
          .getFlowDetail({ flowUuid: actionDef.subroutineUuid, version: actionDef.subroutineVersion })
          .subscribe(flow => {
            this.router.navigate([flow.uuid, flow.version], {
              relativeTo: this.activatedRoute.parent
            });
          });
      });
  }

  confirmDeleteDialog(flow: Flow, action: Action) {
    this.nextPathId = '';
    this.actionUuid = '';
    if (action.type === ActionType.SWITCHING) {
      this.seletedPath(flow, action);
    } else {
      const index = flow.ui.actions.findIndex(x => x.actionUuid === action.actionUuid);
      if (index > -1 && index === flow.ui.actions.length - 1) {
        //delete anyway
        this.confirmAction(flow, action, false, false);
      } else {
        //safe delete
        const request: DeleteActionReq = {
          actionUuid: action.actionUuid,
          flowUuid: flow.uuid,
          version: flow.version
        };
        this.confirmAction(flow, action, true, true, request);
      }
    }
  }

  actionOfPath(flow: Flow, action: Action, path: Path) {
    this.router.navigate(['../flow', flow.uuid, flow.version], {
      relativeTo: this.activatedRoute.parent,
      queryParams: { actionUuid: path.actionUuid ?? action.actionUuid, pathId: path.pathId }
    });
    this.flowService.setTreeNodeSelected(<TreeNode>{
      pathId: path.pathId,
      showHighLightAction: false,
      isScrollGotoElement: true
    });
  }

  showReplaceDialog(flow: Flow, action: Action) {
    this.dialog
      .open(ReplaceActionDialogComponent, {
        width: '1200px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: action
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.reloadActions.emit();
          this.flowService.getMenuTree(flow?.uuid, flow?.version).subscribe();
        }
      });
  }

  addAction(flow: Flow, action: Action) {
    if (
      this.showForApp !== AppName.PROGRAMMABLE_FLOW ||
      (this.showForApp === AppName.PROGRAMMABLE_FLOW && this.checkLimitResource(flow))
    ) {
      this.flowService.setActionSelected(action);
      this.onAddAction.emit(action);
    }
  }

  selectConnector(connector: Connector) {
    this.selectedAction.emit(connector);
  }

  selectCustomAction() {
    const connectorDefault = new Connector({
      actionDefs: [
        <ActionDef>{
          uuid: ActionType.EXTERNAL,
          name: 'External Action',
          outputs: [],
          description: '',
          inputAutoInjectionTokens: []
        }
      ]
    });
    this.selectConnector(connectorDefault);
  }

  isShowAddActionNode(flow: Flow, action: Action, index: number) {
    if (!flow.editable) {
      return false;
    }

    if (flow.ui.actionSelected) {
      if (flow.ui.actionSelected.actionUuid !== action.actionUuid) {
        return false;
      }
    } else {
      if (this.connectorSelected) {
        if (flow.ui.actions.length) {
          if (this.connectorSelected.actionDefs[0]?.uuid === ActionType.SUBROUTINE_RETURN) {
            if (index === flow.ui.actions.length - 1) {
              return true;
            }
            return false;
          }
        }
      }
    }

    return true;
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

  private seletedPath(flow: Flow, action: Action) {
    const paths: Path[] = action.branchingPaths || [];
    this.dialog
      .open(SelectPathDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <SelectPathInput>{
          paths
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          if (res.skip) {
            this.confirmAction(
              flow,
              action,
              false,
              false,
              null,
              'Delete an action will also delete all actions after it. Are you sure?'
            );
            return;
          }

          if (!res.skip) {
            const path: Path = action.branchingPaths.find(item => item.pathId === res.value);
            if (path && path.actionUuid) {
              this.nextPathId = path.pathId;
              this.actionUuid = path.actionUuid;
              const request: DeleteActionReq = {
                actionUuid: action.actionUuid,
                flowUuid: flow.uuid,
                version: flow.version,
                body: {
                  pathId2Keep: this.nextPathId
                }
              };
              this.confirmAction(flow, action, true, false, request);
            } else {
              this.confirmAction(flow, action, false, false);
            }
          }
        }
      });
  }

  private safeDelete(flow: Flow, action: Action, request: DeleteActionReq) {
    this.actionsService.safeDeleteAction(request).subscribe(
      res => {
        if (res.dependencies?.length) {
          this.openResolveDependencyDialog(flow, action, res.dependencies, res?.newActionOutputProperties);
        } else {
          this.toastService.success(`Action has been deleted`);
          this.checkNavigateForSafeDelete(flow, action);
          this.flowService.getMenuTree(flow?.uuid, flow?.version).subscribe();
        }
      },
      error => {
        this.toastService.error(error.message);
      }
    );
  }

  private confirmAction(
    flow: Flow,
    action: Action,
    isCheckDependencies: boolean,
    isShowChecked: boolean = true,
    request?: DeleteActionReq,
    message = 'Are you sure you want to delete this action?'
  ) {
    this.dialog
      .open(ConfirmDeleteActionDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        data: <ConfirmDeleteActionDialog>{
          title: 'Delete action',
          message: message,
          isShowChecked: isShowChecked,
          buttons: [
            {
              action: 'CANCEL',
              color: '',
              type: 'mat-button',
              label: 'Cancel'
            },
            {
              action: 'CONFIRM',
              color: 'warn',
              type: 'mat-raised-button',
              label: 'Confirm'
            }
          ]
        }
      })
      .afterClosed()
      .subscribe((confirmed: ConfirmDeleteOuput) => {
        if (confirmed?.action === 'CONFIRM') {
          if (confirmed.isChecked || !isCheckDependencies) {
            this.deleteAction(flow, action);
            return;
          }
          this.safeDelete(flow, action, request);
        }
      });
  }

  private openResolveDependencyDialog(
    flow: Flow,
    action: Action,
    dependencies: DependencyAction[],
    newActionOutputProperties: PropertyForVariable[]
  ) {
    this.dialog
      .open(ResolveDependencyDialogComponent, {
        width: '800px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <ResolveDependencyInput>{
          dependencys: dependencies,
          action: action,
          pathId2Keep: this.nextPathId,
          replaceActionData: this.replaceActionData,
          newActionOutputProperties
        }
      })
      .afterClosed()
      .subscribe((res: ResolveDependencyOutput) => {
        if (res) {
          if (res.isDependency) {
            this.openResolveDependencyDialog(flow, action, res.dependencies, res?.newActionOutputProperties);
          } else {
            this.toastService.success(`Action has been deleted`);
            this.checkNavigateForSafeDelete(flow, action);
            this.flowService.getMenuTree(flow?.uuid, flow?.version).subscribe();
          }
        }
      });
  }

  private checkNavigateForSafeDelete(flow: Flow, action: Action) {
    if (flow.ui.breadcrumb?.length) {
      const lastBc = flow.ui.breadcrumb[flow.ui.breadcrumb.length - 1];
      if (lastBc) {
        const index = flow.ui.actions.findIndex(x => x.actionUuid === action.actionUuid);
        if (index > -1) {
          const navigateTo = (action: string) => {
            this.router.navigate([flow.uuid, flow.version], {
              relativeTo: this.activatedRoute.parent,
              queryParams: { actionUuid: action, pathId: this.pathId }
            });
          };
          if (index === 0 && index < flow.ui.actions.length - 1) {
            const lastAction = flow.ui.actions[index + 1].actionUuid;
            navigateTo(lastAction);
            return;
          }

          if (index > 0 && index < flow.ui.actions.length - 1) {
            this.reloadActions.emit();
            return;
          }

          const isSwitching = action.type === ActionType.SWITCHING;
          if (index === flow.ui.actions.length - 1 && isSwitching) {
            navigateTo(this.actionUuid);
          }
        }
      } else {
        this.reloadActions.emit();
      }
    } else {
      this.reloadActions.emit();
    }
  }

  private deleteAction(flow: Flow, action: Action) {
    this.deleting = true;
    this.actionsService
      .deleteAction(<DeleteActionReq>{ flowUuid: flow.uuid, version: flow.version, actionUuid: action.actionUuid })
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          this.toastService.success(`Action has been deleted`);
          this.flowService.getMenuTree(flow?.uuid, flow?.version).subscribe();
          if (flow.ui.breadcrumb?.length) {
            const lastBc = flow.ui.breadcrumb[flow.ui.breadcrumb.length - 1];
            if (lastBc) {
              const pathCurrent = lastBc.paths.find(p => p.isCurrent);
              if (pathCurrent.nextActionUuid === action.actionUuid) {
                this.router.navigate([flow.uuid, flow.version], {
                  relativeTo: this.activatedRoute.parent,
                  queryParams: { actionUuid: lastBc.actionUuid, pathId: this.pathId }
                });
              } else {
                this.reloadActions.emit();
              }
            } else {
              this.reloadActions.emit();
            }
          } else {
            this.reloadActions.emit();
          }
        },
        error: err => this.toastService.error(err.message)
      });
  }

  private goToAction(treeNodeSelected: TreeNode) {
    let id = '';
    if (treeNodeSelected.nodeType === 'NORMAL_TRIGGER') {
      id = treeNodeSelected.triggerDef.triggerDefUuid;
    } else if (treeNodeSelected.nodeType === 'SUBROUTINE_TRIGGER') {
      id = treeNodeSelected.subroutineUuid;
    } else {
      id = treeNodeSelected.actionUuid ?? treeNodeSelected.pathId;
    }

    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });

    setTimeout(() => {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 500);

    const action = <Action>{
      number: treeNodeSelected.number,
      actionName: treeNodeSelected.name,
      actionDef: treeNodeSelected.actionDef,
      actionUuid: treeNodeSelected.actionUuid,
      type: treeNodeSelected.actionType
    };

    const flow = this.flowQuery.getValue();
    if (treeNodeSelected.nodeType == 'ACTION' && treeNodeSelected.isShowEditDialog) {
      this.editAction(flow, action);
    }
  }
}
