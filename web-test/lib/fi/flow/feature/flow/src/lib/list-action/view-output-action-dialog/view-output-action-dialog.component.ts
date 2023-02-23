import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Action,
  ActionApi,
  ActionDefService,
  ActionsService,
  ActionSubroutineCall,
  ActionSwitching,
  ActionType,
  BuiltInActionDefQuery,
  ConnectorService,
  Flow,
  FlowActionReq,
  FlowQuery,
  GetActionReq,
  Output,
  OutputFilter,
  UpdateActionReq
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';

type ActionHaveOutput = ActionApi | ActionSubroutineCall | ActionSwitching;

@Component({
  selector: 'b3n-view-output-action-dialog',
  templateUrl: './view-output-action-dialog.component.html',
  styleUrls: ['./view-output-action-dialog.component.scss']
})
export class ViewOutputActionDialogComponent extends DestroySubscriberComponent implements OnInit {
  showForApp: string;
  flow: Flow;
  actionDetail: ActionHaveOutput;
  allowEditOutput: boolean;
  updating: boolean;
  outputs: Output[];
  outputFilter: OutputFilter;
  exposeAllOutputCtrl = new UntypedFormControl(false);

  constructor(
    @Inject(MAT_DIALOG_DATA) public action: Action,
    private dialogRef: MatDialogRef<ViewOutputActionDialogComponent>,
    private appStateQuery: AppStateQuery,
    private builtInActionDefQuery: BuiltInActionDefQuery,
    private flowQuery: FlowQuery,
    private connectorService: ConnectorService,
    private actionsService: ActionsService,
    private actionDefService: ActionDefService,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
    this.flow = this.flowQuery.getValue();

    const req = <GetActionReq>{
      flowUuid: this.flow.uuid,
      version: this.flow.version,
      actionUuid: this.action.actionUuid
    };

    switch (this.action.type) {
      case ActionType.API:
      case ActionType.SUBROUTINE_CALL:
        this.connectorService
          .getActionDefs(this.action.actionDef.connectorUuid)
          .pipe(takeUntil(this.destroySubscriber$))
          .subscribe(actionDef => {
            this.actionsService.getAction(req).subscribe(action => {
              const selectedActionDef = actionDef?.find(actd => actd.uuid === this.action.actionDef.actionDefUuid);
              if (selectedActionDef) {
                this.setParameter(action as ActionHaveOutput, selectedActionDef.outputs);
              } else {
                this.actionDefService
                  .getActionDef(this.action.actionDef.actionDefUuid, this.showForApp === AppName.PROGRAMMABLE_FLOW)
                  .subscribe(actionDef => {
                    this.setParameter(action as ActionHaveOutput, actionDef.outputs);
                  });
              }
            });
          });
        break;
      case ActionType.SWITCHING:
        this.actionsService.getAction(req).subscribe(action => {
          this.setParameter(
            action as ActionHaveOutput,
            this.builtInActionDefQuery.getAll().find(a => a.type === ActionType.SWITCHING).outputs
          );
        });
        break;
      default:
        this.allowEditOutput = false;
        this.actionsService.getOutputAction(req).subscribe(outputs => {
          this.outputs = outputs;
        });
        break;
    }
  }

  private setParameter(action: ActionHaveOutput, outputs: Output[]) {
    this.actionDetail = action;
    this.outputs = outputs;
    this.allowEditOutput = this.flow.editable && this.outputs.length > 0;

    if (this.allowEditOutput) {
      this.exposeAllOutputCtrl.valueChanges.subscribe(val => {
        if (val) {
          this.outputFilter = { isEnabled: false, selectivePaths: null }; // expose all
        } else {
          this.outputFilter = { isEnabled: true, selectivePaths: [] }; // no expose
        }
      });

      if (action.outputFilter) {
        if (
          (action.outputFilter.isEnabled && action.outputFilter.selectivePaths?.length > 0) ||
          !action.outputFilter.isEnabled
        ) {
          this.exposeAllOutputCtrl.setValue(true);
        } else {
          this.exposeAllOutputCtrl.setValue(false);
        }
      } else {
        this.exposeAllOutputCtrl.setValue(true);
      }
    }
  }

  update() {
    if (this.allowEditOutput) {
      this.updating = true;
      this.actionsService
        .updateAction(
          <UpdateActionReq>{
            actionUuid: this.action.actionUuid,
            params: <FlowActionReq>{
              flowUuid: this.flow.uuid,
              version: this.flow.version
            },
            body: <ActionHaveOutput>{
              name: this.actionDetail.name,
              configs: this.actionDetail.configs,
              outputFilter: this.outputFilter
            }
          },
          this.appStateQuery.getName() === AppName.PROGRAMMABLE_FLOW
        )
        .pipe(finalize(() => (this.updating = false)))
        .subscribe(
          res => {
            this.toastService.success('Outputs has been updated');
            this.dialogRef.close(res);
          },
          error => {
            this.toastService.error(error.message);
          }
        );
    }
  }
}
