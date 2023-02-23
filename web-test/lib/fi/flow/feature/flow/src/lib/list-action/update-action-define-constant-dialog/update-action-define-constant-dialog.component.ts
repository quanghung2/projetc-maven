import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Action,
  ActionDefineConstant,
  ActionDefineConstantConfig,
  ActionsService,
  ActionType,
  Flow,
  FlowActionReq,
  FlowQuery,
  GetActionReq,
  ReplaceActionReq,
  ResolveDependencyInput,
  UpdateActionReq
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { ResolveDependencyOutput } from '../../resolve-dependency/resolve-dependency.component';

@Component({
  selector: 'b3n-update-action-define-constant-dialog',
  templateUrl: './update-action-define-constant-dialog.component.html',
  styleUrls: ['./update-action-define-constant-dialog.component.scss']
})
export class UpdateActionDefineConstantDialogComponent implements OnInit {
  flow: Flow;
  actionName: string;
  editingName: boolean;
  updating: boolean;
  actionDefineConstant: ActionDefineConstant;
  invalidConfig: boolean;
  configs: ActionDefineConstantConfig;
  showResolveDependency: boolean;
  dataOfResolve: ResolveDependencyInput;

  constructor(
    @Inject(MAT_DIALOG_DATA) public action: Action,
    private dialogRef: MatDialogRef<UpdateActionDefineConstantDialogComponent>,
    private cdr: ChangeDetectorRef,
    private flowQuery: FlowQuery,
    private appStateQuery: AppStateQuery,
    private actionsService: ActionsService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.flow = this.flowQuery.getValue();
    this.actionName = this.action.actionName;

    this.actionsService
      .getAction(<GetActionReq>{
        flowUuid: this.flow.uuid,
        version: this.flow.version,
        actionUuid: this.action.actionUuid
      })
      .subscribe(action => {
        this.actionDefineConstant = action as ActionDefineConstant;
      });
  }

  private replace() {
    const req = <ReplaceActionReq>{
      actionUuid: this.action.actionUuid,
      params: <FlowActionReq>{
        flowUuid: this.flow.uuid,
        version: this.flow.version
      },
      body: <ActionDefineConstant>{
        name: this.actionName,
        configs: this.configs,
        type: ActionType.DEFINE_CONSTANTS,
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

  update() {
    if (this.flow.editable && !this.editingName && !this.invalidConfig) {
      this.updating = true;
      this.actionsService
        .updateAction(
          <UpdateActionReq>{
            actionUuid: this.action.actionUuid,
            params: <FlowActionReq>{
              flowUuid: this.flow.uuid,
              version: this.flow.version
            },
            body: <ActionDefineConstant>{
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
          err => {
            if (err.code === 'validationError.RemovedConstantHasDependency') {
              this.replace();
            } else {
              this.toastService.error(err.message);
            }
          }
        );
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
