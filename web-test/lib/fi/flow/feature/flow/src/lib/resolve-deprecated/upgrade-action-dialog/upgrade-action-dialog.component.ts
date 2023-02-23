import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Action,
  ActionApi,
  ActionDef,
  ActionDefService,
  ActionsService,
  ActionSubroutineCall,
  ActionType,
  Flow,
  FlowQuery,
  FlowService,
  ReplaceActionReq,
  ResolveDependencyInput,
  VariableForAction
} from '@b3networks/api/flow';
import { AppName, AppStateQuery } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface OpenUpgradeActionDialogReq {
  prevActionUuid: string;
  prevActionPathId: string;
  action: Action;
  actionDetail: ActionApi | ActionSubroutineCall;
  selectedActionDef: ActionDef;
}

@Component({
  selector: 'b3n-upgrade-action-dialog',
  templateUrl: './upgrade-action-dialog.component.html',
  styleUrls: ['./upgrade-action-dialog.component.scss']
})
export class UpgradeActionDialogComponent extends DestroySubscriberComponent implements OnInit {
  showForApp: string;
  AppName = AppName;
  contextVariables: VariableForAction[];
  ActionType = ActionType;
  flow: Flow;
  formUpgradeAction: UntypedFormGroup;
  oldActionDef: ActionDef;
  selectedActionDef: ActionDef;
  invalidForm = true;
  upgrading: boolean;
  showResolveDependency: boolean;
  dataOfResolve: ResolveDependencyInput;

  constructor(
    @Inject(MAT_DIALOG_DATA) public inputDialog: OpenUpgradeActionDialogReq,
    private dialogRef: MatDialogRef<UpgradeActionDialogComponent>,
    private cdr: ChangeDetectorRef,
    private fb: UntypedFormBuilder,
    private actionDefService: ActionDefService,
    private actionsService: ActionsService,
    private flowService: FlowService,
    private flowQuery: FlowQuery,
    private appStateQuery: AppStateQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
    this.flow = this.flowQuery.getValue();
    this.selectedActionDef = this.inputDialog.selectedActionDef;

    forkJoin([
      this.flowService.getContextVariables({
        flowUuid: this.flow.uuid,
        flowVersion: this.flow.version,
        currentActionUuid: this.inputDialog.prevActionUuid || ''
      }),
      this.actionDefService.getActionDef(
        this.inputDialog.actionDetail.actionDef.actionDefUuid,
        this.showForApp === AppName.PROGRAMMABLE_FLOW
      )
    ]).subscribe(([contextVariables, actionDef]) => {
      this.contextVariables = contextVariables;
      this.oldActionDef = actionDef;
    });

    this.formUpgradeAction = this.fb.group({
      name: this.inputDialog.actionDetail.name,
      type: this.selectedActionDef.type,
      actionDefUuid: this.selectedActionDef.uuid,
      configs: {},
      outputFilter: this.inputDialog.actionDetail.outputFilter,
      dependencyUpdateRequest: this.fb.group({
        dependants: {}
      })
    });
  }

  setConfigsAction(req) {
    const curConfig = this.formUpgradeAction.get('configs').value;
    this.formUpgradeAction.patchValue({ configs: Object.assign({}, curConfig, req) });
  }

  upgrade() {
    if (!this.invalidForm) {
      const body = <ActionApi | ActionSubroutineCall>this.formUpgradeAction.value;
      const req = <ReplaceActionReq>{
        params: { flowUuid: this.flow.uuid, version: this.flow.version },
        body: body,
        actionUuid: this.inputDialog.prevActionUuid,
        actionDef: this.selectedActionDef
      };

      this.upgrading = true;
      this.actionsService
        .replaceAction(req, this.appStateQuery.getName() === AppName.PROGRAMMABLE_FLOW)
        .pipe(finalize(() => (this.upgrading = false)))
        .subscribe({
          next: res => {
            if (res?.dependencies?.length) {
              this.showResolveDependency = true;
              this.dataOfResolve = <ResolveDependencyInput>{
                dependencys: res.dependencies,
                action: this.inputDialog.action,
                replace: true,
                replaceActionData: req,
                newActionOutputProperties: res.newActionOutputProperties,
                newActionUuid: res.newActionUuid
              };
            } else {
              this.toastService.success(`Action has been upgrade`);
              this.dialogRef.close(true);
            }
          },
          error: error => {
            this.toastService.error(error.message);
          }
        });
    }
  }

  resultResolve(e) {
    if (e?.isDependency) {
      this.showResolveDependency = false;
      this.cdr.detectChanges();
      this.dataOfResolve.dependencys = e.dependencies;
      this.dataOfResolve.newActionOutputProperties = e?.newActionOutputProperties;
      this.showResolveDependency = true;
    } else {
      this.toastService.success(`Action has been upgrade`);
      this.dialogRef.close(true);
    }
  }
}
