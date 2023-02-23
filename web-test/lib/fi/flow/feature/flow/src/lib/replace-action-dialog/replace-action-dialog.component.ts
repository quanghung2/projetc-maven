import { AfterContentChecked, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  Action,
  ActionDef,
  ActionDefService,
  ActionsService,
  ActionType,
  ConnectorService,
  Flow,
  FlowQuery,
  FlowService,
  GetActionReq,
  OptionActionSwitching,
  Path,
  ReplaceActionReq,
  ResolveDependencyInput,
  TypeAction,
  VariableForAction
} from '@b3networks/api/flow';
import { AppName, AppStateQuery, Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent, generateUUID } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';
import { SelectPathDialogComponent, SelectPathInput } from '../select-path-dialog/select-path-dialog.component';

@Component({
  selector: 'b3n-replace-action-dialog',
  templateUrl: './replace-action-dialog.component.html',
  styleUrls: ['./replace-action-dialog.component.scss']
})
export class ReplaceActionDialogComponent extends DestroySubscriberComponent implements OnInit, AfterContentChecked {
  ActionType = ActionType;
  showForApp: string;
  AppName = AppName;
  flow: Flow;
  contextVariables: VariableForAction[];
  formReplaceAction: UntypedFormGroup;
  selectedActionDef: ActionDef;
  invalidForm = true;
  connectorConfigInvalid: boolean;
  replacing: boolean;
  showResolveDependency: boolean;
  dataOfResolve: ResolveDependencyInput;
  oldAction: TypeAction;
  oldActionDef: ActionDef;

  get type(): UntypedFormControl {
    return this.formReplaceAction.get('type') as UntypedFormControl;
  }
  get name(): UntypedFormControl {
    return this.formReplaceAction.get('name') as UntypedFormControl;
  }
  getErrorName = () => Utils.getErrorInput(this.name);

  constructor(
    @Inject(MAT_DIALOG_DATA) public inputAction: Action,
    private dialogRef: MatDialogRef<ReplaceActionDialogComponent>,
    private fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private actionDefService: ActionDefService,
    private connectorService: ConnectorService,
    private actionsService: ActionsService,
    private flowService: FlowService,
    private appStateQuery: AppStateQuery,
    private flowQuery: FlowQuery,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.showForApp = this.appStateQuery.getName();
    this.flow = this.flowQuery.getValue();

    this.flowService
      .getContextVariables({
        flowUuid: this.flow.uuid,
        flowVersion: this.flow.version,
        currentActionUuid: this.inputAction.actionUuid || ''
      })
      .subscribe(contextVariables => {
        this.contextVariables = contextVariables;
      });

    this.formReplaceAction = this.fb.group({
      name: [
        '',
        Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
      ],
      type: '',
      actionDefUuid: '',
      configs: {},
      dependencyUpdateRequest: this.fb.group({
        dependants: {}
      })
    });

    if (this.inputAction.actionDef) {
      this.connectorService
        .getActionDefs(this.inputAction.actionDef.connectorUuid)
        .pipe(takeUntil(this.destroySubscriber$))
        .subscribe(actionDef => {
          this.getActionDetail(actionDef);
        });
    } else {
      this.getActionDetail();
    }
  }

  private getActionDetail(actionDef?: ActionDef[]) {
    this.actionsService
      .getAction(<GetActionReq>{
        flowUuid: this.flow.uuid,
        version: this.flow.version,
        actionUuid: this.inputAction.actionUuid
      })
      .subscribe(action => {
        switch (action.type) {
          case ActionType.API:
          case ActionType.SUBROUTINE_CALL: {
            const oldActionDef = actionDef?.find(actd => actd.uuid === this.inputAction.actionDef.actionDefUuid);
            if (oldActionDef) {
              this.setParameter(action, oldActionDef);
            } else {
              this.actionDefService
                .getActionDef(this.inputAction.actionDef.actionDefUuid, this.showForApp === AppName.PROGRAMMABLE_FLOW)
                .subscribe(actionDef => {
                  this.setParameter(action, actionDef);
                });
            }
            break;
          }
          default:
            this.oldAction = action;
            break;
        }
      });
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  selectActionDef(a: ActionDef) {
    this.selectedActionDef = null;
    this.cdr.detectChanges();

    this.selectedActionDef = a;
    if (this.selectedActionDef) {
      const defaultName = this.selectedActionDef.type == ActionType.SUBROUTINE_CALL ? 'Transfer to flow: ' : '';
      this.name.setValue(`${defaultName}${this.selectedActionDef.name}`);
    } else {
      this.name.setValue('');
    }

    switch (this.selectedActionDef.uuid) {
      // case ActionType.SUBROUTINE_RETURN:
      case ActionType.SWITCHING:
      case ActionType.TRANSFORM:
      case ActionType.DEFINE_CONSTANTS:
      case ActionType.EXTERNAL:
      case ActionType.SET_SHARED_VARIABLE:
      case ActionType.GET_SHARED_VARIABLE:
      case ActionType.INCREMENT_SHARED_VARIABLE:
      case ActionType.PUSH_SHARED_VARIABLE:
      case ActionType.POP_SHARED_VARIABLE:
      case ActionType.LOOPING_ACTION:
        this.formReplaceAction.patchValue({ type: this.selectedActionDef.uuid, actionDefUuid: '' });
        if (this.selectedActionDef.uuid === ActionType.SWITCHING) {
          this.formReplaceAction.setControl(
            'outputFilter',
            this.fb.group({
              isEnabled: false,
              selectivePaths: null
            })
          );
        }
        break;
      default:
        this.formReplaceAction.patchValue({
          type: this.selectedActionDef.type,
          actionDefUuid: this.selectedActionDef.uuid
        });
        this.formReplaceAction.setControl(
          'outputFilter',
          this.fb.group({
            isEnabled: false,
            selectivePaths: null
          })
        );
        break;
    }
  }

  setConfigsAction(req) {
    const curConfig = this.formReplaceAction.get('configs').value;
    this.formReplaceAction.patchValue({ configs: Object.assign({}, curConfig, req) });
  }

  setActionDef(actionDefUuid: string) {
    this.formReplaceAction.get('actionDefUuid').setValue(actionDefUuid);
  }

  private setParameter(oldAction: TypeAction, oldActionDef: ActionDef) {
    this.oldAction = oldAction;
    this.oldActionDef = oldActionDef;
  }

  private replaceAction(body: TypeAction) {
    switch (this.type.value) {
      case ActionType.SWITCHING:
      case ActionType.TRANSFORM:
      case ActionType.DEFINE_CONSTANTS:
      case ActionType.EXTERNAL:
      case ActionType.SET_SHARED_VARIABLE:
      case ActionType.GET_SHARED_VARIABLE:
      case ActionType.INCREMENT_SHARED_VARIABLE:
      case ActionType.PUSH_SHARED_VARIABLE:
      case ActionType.POP_SHARED_VARIABLE:
        delete body['actionDefUuid'];
        break;
    }

    const req = <ReplaceActionReq>{
      params: { flowUuid: this.flow.uuid, version: this.flow.version },
      body: body,
      actionUuid: this.inputAction.actionUuid,
      actionDef: this.selectedActionDef
    };

    this.replacing = true;
    this.actionsService
      .replaceAction(req, this.appStateQuery.getName() === AppName.PROGRAMMABLE_FLOW)
      .pipe(finalize(() => (this.replacing = false)))
      .subscribe({
        next: res => {
          if (res?.dependencies?.length) {
            this.showResolveDependency = true;
            this.dataOfResolve = <ResolveDependencyInput>{
              dependencys: res.dependencies,
              action: this.inputAction,
              replace: true,
              replaceActionData: req,
              newActionOutputProperties: res.newActionOutputProperties,
              newActionUuid: res.newActionUuid
            };
          } else {
            this.toastService.success(`Action has been replace`);
            this.dialogRef.close(true);
          }
        },
        error: error => {
          this.toastService.error(error.message);
        }
      });
  }

  private seletedPath(options: OptionActionSwitching[], inputPaths: Path[], resolve: Function) {
    let paths: Path[] = [];
    let isHiddenDeleteAllPaths = true;

    if (options && options.length) {
      options.forEach(item => {
        paths.push(<Path>{
          pathName: item.title,
          pathId: item.pathId?.length ? item.pathId : generateUUID()
        });
      });
    } else {
      paths = inputPaths;
      isHiddenDeleteAllPaths = false;
    }

    this.dialog
      .open(SelectPathDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        disableClose: true,
        autoFocus: false,
        data: <SelectPathInput>{
          paths,
          isHiddenDeleteAllPaths,
          title: 'Select Path',
          message: 'Multiple paths detected! Choose which one to put all child actions in.'
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          if (!res.skip) {
            const index = paths?.findIndex(item => item.pathId === res.value);
            resolve(paths[index]);
          }
        }
      });
  }

  replace() {
    if (!this.connectorConfigInvalid && this.name.valid && !this.invalidForm) {
      const body = this.formReplaceAction.value;
      const indexAction = this.flow.ui.actions.findIndex(action => action.actionUuid === this.inputAction.actionUuid);
      if (this.type.value === ActionType.SWITCHING) {
        if (indexAction === this.flow.ui.actions.length - 1 || body.configs?.options?.length === 1) {
          body.dependencyUpdateRequest.pathId2Keep = body.configs?.options[0].pathId;
          this.replaceAction(body);
        } else {
          this.seletedPath(body.configs?.options, null, (path: Path) => {
            if (path) {
              body.dependencyUpdateRequest.pathId2Keep = path.pathId;
              this.replaceAction(body);
            }
          });
        }
      } else if (this.inputAction.type === ActionType.SWITCHING) {
        if (this.inputAction.branchingPaths.length === 1) {
          body.dependencyUpdateRequest.pathId2Keep = this.inputAction.branchingPaths[0].pathId;
          this.replaceAction(body);
        } else {
          this.seletedPath(null, this.inputAction.branchingPaths, (path: Path) => {
            if (path) {
              body.dependencyUpdateRequest.pathId2Keep = path.pathId;
              this.replaceAction(body);
            }
          });
        }
      } else {
        this.replaceAction(body);
      }
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
      this.toastService.success(`Action has been replace`);
      this.dialogRef.close(true);
    }
  }
}
