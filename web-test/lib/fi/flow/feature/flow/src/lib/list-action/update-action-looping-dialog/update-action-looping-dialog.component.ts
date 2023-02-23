import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Action,
  ActionLooping,
  ActionLoopingConfig,
  ActionsService,
  Flow,
  FlowActionReq,
  FlowQuery,
  FlowService,
  GetActionReq,
  UpdateActionReq,
  VariableForAction
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-action-looping-dialog',
  templateUrl: './update-action-looping-dialog.component.html',
  styleUrls: ['./update-action-looping-dialog.component.scss']
})
export class UpdateActionLoopingDialogComponent implements OnInit {
  flow: Flow;
  actionName: string;
  editingName: boolean;
  updating: boolean;
  contextVariables: VariableForAction[];
  actionLooping: ActionLooping;
  invalidConfig: boolean;
  configs: ActionLoopingConfig;

  constructor(
    @Inject(MAT_DIALOG_DATA) public action: Action,
    private dialogRef: MatDialogRef<UpdateActionLoopingDialogComponent>,
    private appStateQuery: AppStateQuery,
    private flowQuery: FlowQuery,
    private flowService: FlowService,
    private actionsService: ActionsService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.flow = this.flowQuery.getValue();
    this.actionName = this.action.actionName;

    combineLatest([
      this.actionsService.getAction(<GetActionReq>{
        flowUuid: this.flow.uuid,
        version: this.flow.version,
        actionUuid: this.action.actionUuid
      }),
      this.flowService.getContextVariables({
        flowUuid: this.flow.uuid,
        flowVersion: this.flow.version,
        currentActionUuid: this.action.actionUuid
      })
    ]).subscribe(([action, variableForAction]) => {
      this.actionLooping = action as ActionLooping;
      this.contextVariables = variableForAction;
    });
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
            body: <ActionLooping>{
              name: this.actionName,
              configs: this.configs,
              outputFilter: this.actionLooping.outputFilter
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
    }
  }
}
