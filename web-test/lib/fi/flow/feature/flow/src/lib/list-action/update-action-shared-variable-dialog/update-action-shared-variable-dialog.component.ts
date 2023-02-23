import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Action,
  ActionSharedVariable,
  ActionSharedVariableConfig,
  ActionsService,
  ActionType,
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
  selector: 'b3n-update-action-shared-variable-dialog',
  templateUrl: './update-action-shared-variable-dialog.component.html',
  styleUrls: ['./update-action-shared-variable-dialog.component.scss']
})
export class UpdateActionSharedVariableDialogComponent implements OnInit {
  flow: Flow;
  actionName: string;
  editingName: boolean;
  updating: boolean;
  contextVariables: VariableForAction[];
  actionSharedVariable: ActionSharedVariable;
  invalidConfig: boolean;
  configs: ActionSharedVariableConfig;

  constructor(
    @Inject(MAT_DIALOG_DATA) public action: Action,
    private dialogRef: MatDialogRef<UpdateActionSharedVariableDialogComponent>,
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
      this.actionSharedVariable = action as ActionSharedVariable;
      this.contextVariables = variableForAction;
    });
  }

  getIcon() {
    switch (this.action.type) {
      case ActionType.SET_SHARED_VARIABLE:
        return 'assets/flow-shared/icons/upload.svg';
      case ActionType.GET_SHARED_VARIABLE:
        return 'assets/flow-shared/icons/download.svg';
      case ActionType.PUSH_SHARED_VARIABLE:
        return 'assets/flow-shared/icons/playlist_add.svg';
      case ActionType.POP_SHARED_VARIABLE:
        return 'assets/flow-shared/icons/playlist_remove.svg';
      case ActionType.INCREMENT_SHARED_VARIABLE:
        return 'assets/flow-shared/icons/plus_one.svg';
    }
    return '';
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
            body: <ActionSharedVariable>{
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
    }
  }
}
