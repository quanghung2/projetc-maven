import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Action,
  ActionsService,
  ActionTransform,
  ActionTransformConfig,
  ActionType,
  Flow,
  FlowActionReq,
  FlowQuery,
  FlowService,
  GetActionReq,
  ReplaceActionReq,
  ResolveDependencyInput,
  UpdateActionReq,
  VariableForAction
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ResolveDependencyOutput } from '../../resolve-dependency/resolve-dependency.component';

@Component({
  selector: 'b3n-update-action-transform-dialog',
  templateUrl: './update-action-transform-dialog.component.html',
  styleUrls: ['./update-action-transform-dialog.component.scss']
})
export class UpdateActionTransformDialogComponent implements OnInit {
  flow: Flow;
  actionName: string;
  editingName: boolean;
  updating: boolean;
  contextVariables: VariableForAction[];
  actionTransform: ActionTransform;
  curToken: string;
  invalidConfig: boolean;
  configs: ActionTransformConfig;
  showResolveDependency: boolean;
  dataOfResolve: ResolveDependencyInput;

  constructor(
    @Inject(MAT_DIALOG_DATA) public action: Action,
    private dialogRef: MatDialogRef<UpdateActionTransformDialogComponent>,
    private cdr: ChangeDetectorRef,
    private flowQuery: FlowQuery,
    private appStateQuery: AppStateQuery,
    private flowService: FlowService,
    private actionsService: ActionsService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.flow = this.flowQuery.getValue();
    this.actionName = this.action.actionName;

    forkJoin([
      this.flowService.getContextVariables({
        flowUuid: this.flow.uuid,
        flowVersion: this.flow.version,
        currentActionUuid: this.action.actionUuid
      }),
      this.actionsService.getAction(<GetActionReq>{
        flowUuid: this.flow.uuid,
        version: this.flow.version,
        actionUuid: this.action.actionUuid
      })
    ]).subscribe(([contextVariables, action]) => {
      this.contextVariables = contextVariables;
      this.actionTransform = action as ActionTransform;
      this.curToken = (action as ActionTransform).configs.transformFunction.type;
    });
  }

  update() {
    if (this.flow.editable && !this.editingName && !this.invalidConfig) {
      this.updating = true;
      if (this.curToken === this.configs.transformFunction.type) {
        this.actionsService
          .updateAction(
            <UpdateActionReq>{
              actionUuid: this.action.actionUuid,
              params: <FlowActionReq>{
                flowUuid: this.flow.uuid,
                version: this.flow.version
              },
              body: <ActionTransform>{
                name: this.actionName,
                configs: this.configs
              }
            },
            this.appStateQuery.getName() === AppName.PROGRAMMABLE_FLOW
          )
          .pipe(finalize(() => (this.updating = false)))
          .subscribe(
            res => {
              this.toastService.success('Action has been updated');
              this.dialogRef.close(res);
            },
            error => {
              this.toastService.error(error.message);
            }
          );
      } else {
        const req = <ReplaceActionReq>{
          actionUuid: this.action.actionUuid,
          params: <FlowActionReq>{
            flowUuid: this.flow.uuid,
            version: this.flow.version
          },
          body: <ActionTransform>{
            name: this.actionName,
            configs: this.configs,
            type: ActionType.TRANSFORM,
            dependencyUpdateRequest: {
              dependants: {}
            }
          }
        };
        this.actionsService
          .replaceAction(req, this.appStateQuery.getName() === AppName.PROGRAMMABLE_FLOW)
          .pipe(finalize(() => (this.updating = false)))
          .subscribe(
            res => {
              if (res?.dependencies?.length) {
                this.showResolveDependency = true;
                this.dataOfResolve = <ResolveDependencyInput>{
                  dependencys: res.dependencies,
                  action: this.action,
                  replace: true,
                  replaceActionData: req,
                  newActionOutputProperties: res?.newActionOutputProperties
                };
              } else {
                this.toastService.success('Action has been updated');
                this.dialogRef.close(res);
              }
            },
            error => {
              this.toastService.error(error.message);
            }
          );
      }
    }
  }

  resultResolve(e: ResolveDependencyOutput) {
    if (e?.isDependency) {
      this.showResolveDependency = false;
      this.cdr.detectChanges();
      this.dataOfResolve.dependencys = e.dependencies;
      this.dataOfResolve.newActionOutputProperties = e?.newActionOutputProperties;
      this.showResolveDependency = true;
    } else {
      this.toastService.success(`Action has been updated`);
      this.dialogRef.close(true);
    }
  }
}
