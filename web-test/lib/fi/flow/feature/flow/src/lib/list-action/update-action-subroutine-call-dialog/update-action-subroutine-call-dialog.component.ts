import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Action,
  ActionDef,
  ActionDefService,
  ActionsService,
  ActionSubroutineCall,
  ActionSubroutineConfig,
  ConnectorService,
  Flow,
  FlowActionReq,
  FlowQuery,
  FlowService,
  GetActionReq,
  UpdateActionReq,
  VariableForAction
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-update-action-subroutine-call-dialog',
  templateUrl: './update-action-subroutine-call-dialog.component.html',
  styleUrls: ['./update-action-subroutine-call-dialog.component.scss']
})
export class UpdateActionSubroutineCallDialogComponent extends DestroySubscriberComponent implements OnInit {
  showForApp: string;
  flow: Flow;
  actionName: string;
  editingName: boolean;
  updating: boolean;
  contextVariables: VariableForAction[];
  actionSubroutineCall: ActionSubroutineCall;
  invalidConfig: boolean;
  configs: ActionSubroutineConfig;
  selectedActionDef: ActionDef;

  constructor(
    @Inject(MAT_DIALOG_DATA) public action: Action,
    private dialogRef: MatDialogRef<UpdateActionSubroutineCallDialogComponent>,
    private actionDefsService: ActionDefService,
    private connectorService: ConnectorService,
    private appStateQuery: AppStateQuery,
    private flowQuery: FlowQuery,
    private flowService: FlowService,
    private actionsService: ActionsService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
    this.flow = this.flowQuery.getValue();
    this.actionName = this.action.actionName;

    this.flowService
      .getContextVariables({
        flowUuid: this.flow.uuid,
        flowVersion: this.flow.version,
        currentActionUuid: this.action.actionUuid
      })
      .subscribe(contextVariables => {
        this.contextVariables = contextVariables;
      });

    this.connectorService
      .getActionDefs(this.action.actionDef.connectorUuid)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(actionDef => {
        this.actionsService
          .getAction(<GetActionReq>{
            flowUuid: this.flow.uuid,
            version: this.flow.version,
            actionUuid: this.action.actionUuid
          })
          .subscribe(action => {
            const selectedActionDef = actionDef.find(actd => actd.uuid === this.action.actionDef.actionDefUuid);
            if (selectedActionDef) {
              this.setParameter(action as ActionSubroutineCall, selectedActionDef);
            } else {
              this.actionDefsService
                .getActionDef(this.action.actionDef.actionDefUuid, this.showForApp === AppName.PROGRAMMABLE_FLOW)
                .subscribe(actionDef => {
                  this.setParameter(action as ActionSubroutineCall, actionDef);
                });
            }
          });
      });
  }

  private setParameter(action: ActionSubroutineCall, selectedActionDef: ActionDef) {
    this.actionSubroutineCall = action;
    this.selectedActionDef = selectedActionDef;
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
            body: <ActionSubroutineCall>{
              name: this.actionName,
              configs: this.configs,
              outputFilter: this.actionSubroutineCall.outputFilter
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
