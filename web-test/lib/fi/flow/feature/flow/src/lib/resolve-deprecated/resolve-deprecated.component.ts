import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  Action,
  ActionApi,
  ActionsService,
  ActionSubroutineCall,
  ActionType,
  CodeWarning,
  ConnectorReq,
  ConnectorService,
  DataSourceService,
  DeleteActionReq,
  DependencyAction,
  FlowActionReq,
  FlowService,
  FlowWarning,
  GetActionReq,
  Path,
  PropertyForVariable,
  ResolveDependencyInput,
  SimpleAppFlowService,
  Trigger,
  TriggerQuery,
  TriggerService
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import {
  ConfirmDeleteActionDialog,
  ConfirmDeleteActionDialogComponent
} from '../confirm-delete-action-dialog/confirm-delete-action-dialog.component';
import { UpdateTriggerDialogComponent } from '../flow-detail/update-trigger-dialog/update-trigger-dialog.component';
import { UpdateActionApiDialogComponent } from '../list-action/update-action-api-dialog/update-action-api-dialog.component';
import { UpdateActionDefineConstantDialogComponent } from '../list-action/update-action-define-constant-dialog/update-action-define-constant-dialog.component';
import { UpdateActionExternalDialogComponent } from '../list-action/update-action-external-dialog/update-action-external-dialog.component';
import { UpdateActionLoopingDialogComponent } from '../list-action/update-action-looping-dialog/update-action-looping-dialog.component';
import { UpdateActionSharedVariableDialogComponent } from '../list-action/update-action-shared-variable-dialog/update-action-shared-variable-dialog.component';
import { UpdateActionSubroutineCallDialogComponent } from '../list-action/update-action-subroutine-call-dialog/update-action-subroutine-call-dialog.component';
import { UpdateActionSubroutineReturnDialogComponent } from '../list-action/update-action-subroutine-return-dialog/update-action-subroutine-return-dialog.component';
import { UpdateActionSwitchingDialogComponent } from '../list-action/update-action-switching-dialog/update-action-switching-dialog.component';
import { UpdateActionTransformDialogComponent } from '../list-action/update-action-transform-dialog/update-action-transform-dialog.component';
import { ReplaceActionDialogComponent } from '../replace-action-dialog/replace-action-dialog.component';
import {
  ReplaceTriggerDialogComponent,
  ReplaceTriggerDialogReq
} from '../replace-trigger-dialog/replace-trigger-dialog.component';
import { ResolveDependencyDialogComponent } from '../resolve-dependency-dialog/resolve-dependency-dialog.component';
import { ResolveDependencyOutput } from '../resolve-dependency/resolve-dependency.component';
import { SelectPathDialogComponent, SelectPathInput } from '../select-path-dialog/select-path-dialog.component';
import {
  OpenUpgradeActionDialogReq,
  UpgradeActionDialogComponent
} from './upgrade-action-dialog/upgrade-action-dialog.component';

type ActionDetailType = ActionApi | ActionSubroutineCall;

@Component({
  selector: 'b3n-resolve-deprecated',
  templateUrl: './resolve-deprecated.component.html',
  styleUrls: ['./resolve-deprecated.component.scss']
})
export class ResolveDeprecatedComponent implements OnInit, OnDestroy {
  readonly codeWarning = CodeWarning;
  readonly actionType = ActionType;
  showForApp: string;
  flowWarnings: FlowWarning[] = [];
  params: FlowActionReq;
  nextPathId: string;
  actionUuid: string;
  deleting: boolean;
  isResolveDeprecatedTrigger: boolean;
  isResolveIncompleteTrigger: boolean;
  indexTriggerDep: number;
  indexTriggerInc: number;
  trigger: Trigger;

  get isHasTriggerDep() {
    return !!this.flowWarnings.find(item => item.code === CodeWarning.TRIGGER_DEF_DEPRECATION);
  }

  get isHasActionDep() {
    return !!this.flowWarnings.find(item => item.code === CodeWarning.ACTION_DEF_DEPRECATION);
  }

  get isHasTriggerInc() {
    return !!this.flowWarnings.find(item => item.code === CodeWarning.INCOMPLETE_TRIGGER);
  }

  get isHasActionInc() {
    return !!this.flowWarnings.find(item => item.code === CodeWarning.INCOMPLETE_ACTION);
  }

  constructor(
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private appStateQuery: AppStateQuery,
    private triggerQuery: TriggerQuery,
    private flowService: FlowService,
    private triggerService: TriggerService,
    private actionsService: ActionsService,
    private simpleAppFlowService: SimpleAppFlowService,
    private toastService: ToastService,
    private dataSourceService: DataSourceService,
    private connectorService: ConnectorService
  ) {}

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
    this.trigger = this.triggerQuery.getValue();

    this.route.params.subscribe(params => {
      this.params = <FlowActionReq>params;
      this.onInitFlowWarning();
      this.getConnector(this.params.flowUuid, this.params.version);
    });
  }

  ngOnDestroy() {
    this.dataSourceService.reset();
  }

  onInitFlowWarning() {
    this.flowService.getFlowWarning(this.params).subscribe(flowWarnings => {
      // TRIGGER_DEF_DEPRECATION
      const indexTrigger = flowWarnings.findIndex(
        flowWarning => flowWarning.code === CodeWarning.TRIGGER_DEF_DEPRECATION
      );
      if (indexTrigger > -1) {
        this.indexTriggerDep = 0;
        const move = (from, to, ...list) => (from === to ? list : (list.splice(to, 0, ...list.splice(from, 1)), list));
        flowWarnings = move(indexTrigger, this.indexTriggerDep, ...flowWarnings);
      }

      // INCOMPLETE_TRIGGER
      const indexTriggerIncomplete = flowWarnings.findIndex(
        flowWarning => flowWarning.code === CodeWarning.INCOMPLETE_TRIGGER
      );
      if (indexTriggerIncomplete > -1) {
        this.indexTriggerDep === 0 ? (this.indexTriggerInc = 1) : (this.indexTriggerInc = 0);
        const move = (from, to, ...list) => (from === to ? list : (list.splice(to, 0, ...list.splice(from, 1)), list));
        flowWarnings = move(indexTriggerIncomplete, this.indexTriggerInc, ...flowWarnings);
      }

      // ACTION_DEF_DEPRECATION || INCOMPLETE_ACTION
      let relatedActionUuids: string[] = [];
      flowWarnings.forEach(item => {
        if (item.code === CodeWarning.ACTION_DEF_DEPRECATION || item.code === CodeWarning.INCOMPLETE_ACTION) {
          item.actions = [];
          relatedActionUuids = [...relatedActionUuids, ...item.relatedActionUuids];
        }
      });

      if (relatedActionUuids.length) {
        this.actionsService
          .getActionsByUUIDs(<GetActionReq>{
            flowUuid: this.params.flowUuid,
            version: this.params.version,
            uuids: relatedActionUuids
          })
          .subscribe(actions => {
            actions.forEach(action => {
              flowWarnings.forEach(flowWarning => {
                const index = flowWarning?.relatedActionUuids?.indexOf(action.actionUuid);
                if (index > -1) {
                  flowWarning.actions.push(action);
                }
              });
            });

            this.flowWarnings = flowWarnings;
          });
      } else {
        this.flowWarnings = flowWarnings;
      }
    });
  }

  openConfirmResolveAction(typeAction: string, action: Action, actionFlow: FlowWarning) {
    const req = <GetActionReq>{
      flowUuid: this.params.flowUuid,
      version: this.params.version,
      actionUuid: action.actionUuid
    };

    this.actionsService.getAction(req).subscribe(actionDetail => {
      if (typeAction === 'UPGRADE') {
        this.showUpgradeActionDialog(action, actionDetail as ActionDetailType, actionFlow);
      } else if (typeAction === 'DELETE') {
        this.confirmDeleteDialog(action, actionDetail as ActionDetailType, actionFlow);
      } else if (typeAction === 'CHANGE') {
        this.showReplaceActionDialog(action);
      }
    });
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

  editAction(action: Action) {
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

    dialogUpdateAction.afterClosed().subscribe(res => {
      if (res) {
        this.reloadData(false);
        action.isResolvedIncomplete = true;
      }
    });
  }

  private getConnector(flowUuid: string, version: number) {
    const request = <ConnectorReq>{
      flowVersion: version,
      flowUuid: flowUuid
    };
    this.connectorService.getConnectors(request, this.showForApp == AppName.PROGRAMMABLE_FLOW).subscribe();
  }

  private confirmDeleteDialog(action: Action, actionDetail: ActionDetailType, actionFlow: FlowWarning) {
    this.nextPathId = '';
    if (action.type === ActionType.SWITCHING) {
      const options = actionDetail.configs['options'];
      const paths: Path[] = [];
      if (options && options.length) {
        options.forEach(item => {
          paths.push(<Path>{
            pathName: item['title'],
            pathId: item['pathId'],
            actionUuid: item['actionUuid']
          });
        });
      }

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
                action,
                actionFlow,
                false,
                false,
                null,
                'Delete an action will also delete all actions after it. Are you sure?'
              );
              return;
            }

            if (!res.skip) {
              const path: Path = paths.find(item => item.pathId === res.value);
              this.nextPathId = path.pathId;
              const request: DeleteActionReq = {
                actionUuid: action.actionUuid,
                flowUuid: this.params.flowUuid,
                version: this.params.version,
                body: {
                  pathId2Keep: this.nextPathId
                }
              };

              this.confirmAction(action, actionFlow, true, false, request);
            }
          }
        });
    } else {
      //safe delete
      const request: DeleteActionReq = {
        actionUuid: action.actionUuid,
        flowUuid: this.params.flowUuid,
        version: this.params.version
      };
      this.confirmAction(action, actionFlow, true, true, request);
    }
  }

  private safeDelete(action: Action, request: DeleteActionReq, actionFlow: FlowWarning) {
    this.actionsService.safeDeleteAction(request).subscribe({
      next: res => {
        if (res?.dependencies?.length) {
          this.openResolveDependencyDialog(action, res.dependencies, actionFlow, res?.newActionOutputProperties);
        } else {
          this.reloadData(false);
          this.toastService.success(`Action has deleted`);

          const index = actionFlow.actions.indexOf(action);
          if (index > -1) {
            actionFlow.actions.splice(index, 1);
            this.flowWarnings = this.flowWarnings.filter(item => {
              if (
                item.code === CodeWarning.TRIGGER_DEF_DEPRECATION ||
                (item.code === CodeWarning.ACTION_DEF_DEPRECATION && item.actions?.length)
              ) {
                return item;
              }
              return null;
            });
          }
        }
      },
      error: error => {
        this.toastService.error(error.message);
      }
    });
  }

  private confirmAction(
    action: Action,
    actionFlow: FlowWarning,
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
      .subscribe(confirmed => {
        if (confirmed?.action === 'CONFIRM') {
          if (confirmed.isChecked || !isCheckDependencies) {
            this.deleteAction(action, actionFlow);
            return;
          }
          this.safeDelete(action, request, actionFlow);
        }
      });
  }

  private openResolveDependencyDialog(
    action: Action,
    dependencies: DependencyAction[],
    actionFlow: FlowWarning,
    newActionOutputProperties: PropertyForVariable[]
  ) {
    this.dialog
      .open(ResolveDependencyDialogComponent, {
        width: '700px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <ResolveDependencyInput>{
          dependencys: dependencies,
          action: action,
          pathId2Keep: this.nextPathId,
          newActionOutputProperties
        }
      })
      .afterClosed()
      .subscribe((res: ResolveDependencyOutput) => {
        if (res) {
          if (res.isDependency) {
            this.openResolveDependencyDialog(action, res.dependencies, actionFlow, res?.newActionOutputProperties);
          } else {
            this.reloadData(false);

            this.toastService.success(`Action has been deleted`);
            const index = actionFlow.actions.indexOf(action);

            if (index > -1) {
              actionFlow.actions.splice(index, 1);
              this.flowWarnings = this.flowWarnings.filter(item => {
                if (
                  item.code === CodeWarning.TRIGGER_DEF_DEPRECATION ||
                  (item.code === CodeWarning.ACTION_DEF_DEPRECATION && item.actions?.length)
                ) {
                  return item;
                }
                return null;
              });
            }
          }
        }
      });
  }

  private deleteAction(action: Action, actionFlow: FlowWarning) {
    this.deleting = true;
    this.actionsService
      .deleteAction(<DeleteActionReq>{
        flowUuid: this.params.flowUuid,
        version: this.params.version,
        actionUuid: action.actionUuid
      })
      .pipe(finalize(() => (this.deleting = false)))
      .subscribe({
        next: () => {
          this.reloadData(false);
          this.toastService.success(`Action has been deleted`);
          const index = actionFlow.actions.indexOf(action);
          if (index > -1) {
            actionFlow.actions.splice(index, 1);
            this.flowWarnings = this.flowWarnings.filter(item => {
              if (
                item.code === CodeWarning.TRIGGER_DEF_DEPRECATION ||
                (item.code === CodeWarning.ACTION_DEF_DEPRECATION && item.actions?.length)
              ) {
                return item;
              }
              return null;
            });
          }
        },
        error: () => this.toastService.error(`Delete action failed`)
      });
  }

  private showUpgradeActionDialog(action: Action, actionDetail: ActionDetailType, actionFlow: FlowWarning) {
    this.dialog
      .open(UpgradeActionDialogComponent, {
        width: '1200px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <OpenUpgradeActionDialogReq>{
          prevActionUuid: action.actionUuid,
          prevActionPathId: null,
          action: action,
          actionDetail: actionDetail,
          selectedActionDef: actionFlow.latestActionDef
        }
      })
      .afterClosed()
      .subscribe(value => {
        if (value) {
          this.reloadData(false);
          action.isResolvedDeprecate = value;
        }
      });
  }

  private showReplaceActionDialog(action: Action) {
    this.dialog
      .open(ReplaceActionDialogComponent, {
        width: '1200px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: action
      })
      .afterClosed()
      .subscribe(value => {
        if (value) {
          this.reloadData(false);
          action.isResolvedDeprecate = value;
        }
      });
  }

  // Resolve deprecated for trigger
  openConfirmResolveTrigger(typeTrigger: string, flowWarning: FlowWarning) {
    if (!this.isResolveDeprecatedTrigger) {
      this.dialog
        .open(ReplaceTriggerDialogComponent, {
          width: '1200px',
          panelClass: 'fif-dialog',
          disableClose: true,
          autoFocus: false,
          data: <ReplaceTriggerDialogReq>{
            isDeprecated: true,
            replace: true,
            isTrigger: true,
            isShowOnlyParameter: typeTrigger === 'UPGRADE',
            triggerDef: flowWarning?.latestTriggerDef
          }
        })
        .afterClosed()
        .subscribe(success => {
          if (success) {
            this.reloadData(true);
            this.isResolveDeprecatedTrigger = true;
          }
        });
    }
  }

  completeTrigger() {
    this.dialog
      .open(UpdateTriggerDialogComponent, {
        width: '700px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.reloadData(true);
          this.isResolveIncompleteTrigger = true;
        }
      });
  }

  private reloadData(isTrigger: boolean) {
    let dataObservable$;
    if (isTrigger) {
      dataObservable$ = this.triggerService.getTrigger(this.params.flowUuid, this.params.version);
    } else {
      if (this.appStateQuery.getName() === AppName.PROGRAMMABLE_FLOW) {
        dataObservable$ = this.simpleAppFlowService.getActions(<GetActionReq>this.params);
      } else {
        dataObservable$ = this.flowService.getActions(<GetActionReq>this.params);
      }
    }
    this.flowService.getFlowDetail(<GetActionReq>this.params).subscribe();
    dataObservable$.subscribe();
  }
}
