import { AfterContentChecked, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ActionDef,
  ActionsService,
  ActionType,
  Connector,
  Flow,
  FlowQuery,
  FlowService,
  OptionActionSwitching,
  Path,
  PrerequisiteQuery,
  TypeAction,
  VariableForAction
} from '@b3networks/api/flow';
import { AppName, AppStateQuery, Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent, generateUUID } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';
import { SelectPathDialogComponent, SelectPathInput } from '../../select-path-dialog/select-path-dialog.component';

export interface OpenAddActionDialogReq {
  prevActionUuid: string;
  prevActionPathId: string;
  connectorSelected: Connector;
}

@Component({
  selector: 'b3n-add-action-dialog',
  templateUrl: './add-action-dialog.component.html',
  styleUrls: ['./add-action-dialog.component.scss']
})
export class AddActionDialogComponent extends DestroySubscriberComponent implements OnInit, AfterContentChecked {
  flow: Flow;
  contextVariables: VariableForAction[];
  ActionType = ActionType;
  formCreateAction: UntypedFormGroup;
  selectedConnector: Connector;
  selectedActionDef: ActionDef;
  typeOfAction: ActionType;
  invalidForm = true;
  configInvalid = true;
  invalidConnectors: string[];
  adding: boolean;

  get name(): UntypedFormControl {
    return this.formCreateAction.get('name') as UntypedFormControl;
  }
  getErrorName = () => Utils.getErrorInput(this.name);

  constructor(
    @Inject(MAT_DIALOG_DATA) public inputDialog: OpenAddActionDialogReq,
    private dialogRef: MatDialogRef<AddActionDialogComponent>,
    private cdr: ChangeDetectorRef,
    private fb: UntypedFormBuilder,
    private actionsService: ActionsService,
    private flowService: FlowService,
    private flowQuery: FlowQuery,
    private prerequisiteQuery: PrerequisiteQuery,
    private appStateQuery: AppStateQuery,
    private toastService: ToastService,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.flow = this.flowQuery.getValue();

    this.prerequisiteQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(res => {
        this.invalidConnectors = res.invalidConnectors;
      });

    this.flowService
      .getContextVariables({
        flowUuid: this.flow.uuid,
        flowVersion: this.flow.version,
        prevActionUuid: this.inputDialog.prevActionUuid || ''
      })
      .subscribe(contextVariables => {
        this.contextVariables = contextVariables;
      });

    this.selectedConnector = this.inputDialog.connectorSelected;
    this.selectedActionDef = this.selectedConnector.actionDefs[0];
    const defaultName = this.selectedActionDef.type == ActionType.SUBROUTINE_CALL ? 'Transfer to flow: ' : '';

    this.formCreateAction = this.fb.group({
      name: [
        `${defaultName}${this.selectedActionDef.name}`,
        Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
      ],
      type: [''],
      actionDefUuid: [''],
      prevActionUuid: [this.inputDialog.prevActionUuid],
      prevActionPathId: [this.inputDialog.prevActionPathId],
      configs: [{}]
    });

    switch (this.selectedActionDef.uuid) {
      case ActionType.SWITCHING:
      case ActionType.SUBROUTINE_RETURN:
      case ActionType.TRANSFORM:
      case ActionType.DEFINE_CONSTANTS:
      case ActionType.EXTERNAL:
      case ActionType.SET_SHARED_VARIABLE:
      case ActionType.GET_SHARED_VARIABLE:
      case ActionType.INCREMENT_SHARED_VARIABLE:
      case ActionType.PUSH_SHARED_VARIABLE:
      case ActionType.POP_SHARED_VARIABLE:
      case ActionType.LOOPING_ACTION:
        this.typeOfAction = this.selectedActionDef.uuid;
        this.formCreateAction.patchValue({ actionDefUuid: '' });
        if (this.typeOfAction === ActionType.SWITCHING) {
          this.formCreateAction.setControl(
            'outputFilter',
            this.fb.group({
              isEnabled: true,
              selectivePaths: [[]]
            })
          );
        }
        break;
      default:
        this.typeOfAction = this.selectedActionDef.type;
        this.formCreateAction.patchValue({ actionDefUuid: this.selectedActionDef.uuid });
        this.formCreateAction.setControl(
          'outputFilter',
          this.fb.group({
            isEnabled: true,
            selectivePaths: [[]]
          })
        );
        break;
    }
    this.formCreateAction.patchValue({ type: this.typeOfAction });
  }

  ngAfterContentChecked(): void {
    this.cdr.detectChanges();
  }

  setConfigsAction(req) {
    const curConfig = this.formCreateAction.get('configs').value;
    this.formCreateAction.patchValue({ configs: Object.assign({}, curConfig, req) });
  }

  setActionDef(actionDefUuid: string) {
    this.formCreateAction.get('actionDefUuid').setValue(actionDefUuid);
  }

  showWarning(connectorUuid: string) {
    return this.invalidConnectors?.includes(connectorUuid);
  }

  private addAction(pathId?: string) {
    const body = <TypeAction>this.formCreateAction.value;
    switch (this.typeOfAction) {
      case ActionType.SWITCHING:
      case ActionType.SUBROUTINE_RETURN:
      case ActionType.TRANSFORM:
      case ActionType.DEFINE_CONSTANTS:
      case ActionType.EXTERNAL:
      case ActionType.SET_SHARED_VARIABLE:
      case ActionType.GET_SHARED_VARIABLE:
      case ActionType.INCREMENT_SHARED_VARIABLE:
      case ActionType.PUSH_SHARED_VARIABLE:
      case ActionType.POP_SHARED_VARIABLE:
        delete body['actionDefUuid'];
        if (this.typeOfAction === ActionType.SWITCHING) {
          if (pathId?.length) {
            body['targetDescendantPathId'] = pathId;
          }
        }
        break;
    }

    this.adding = true;
    this.actionsService
      .addAction(this.flow.uuid, this.flow.version, body, this.appStateQuery.getName() === AppName.PROGRAMMABLE_FLOW)
      .pipe(finalize(() => (this.adding = false)))
      .subscribe({
        next: res => {
          this.toastService.success('Action has been created');
          this.dialogRef.close(res);
        },
        error: err => this.toastService.error(err.message)
      });
  }

  private seletedPath(options: OptionActionSwitching[], resolve: Function) {
    const paths: Path[] = [];

    if (options && options.length) {
      options.forEach(item => {
        paths.push(<Path>{
          pathName: item.title,
          pathId: item.pathId?.length ? item.pathId : generateUUID()
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
          paths,
          isHiddenDeleteAllPaths: true,
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

  add() {
    if (this.name.valid && !this.invalidForm) {
      const indexAction = this.flow.ui.actions.findIndex(
        action => action.actionUuid === this.inputDialog.prevActionUuid
      );
      if (this.typeOfAction === ActionType.SWITCHING) {
        const body = this.formCreateAction.value;
        if (indexAction === this.flow.ui.actions.length - 1 || body.configs?.options?.length === 1) {
          const pathId = body.configs?.options[0].pathId;
          this.addAction(pathId);
        } else {
          this.seletedPath(body.configs?.options, (path: Path) => {
            if (path) {
              this.addAction(path.pathId);
            }
          });
        }
      } else {
        const pathId = generateUUID();
        this.addAction(pathId);
      }
    }
  }
}
