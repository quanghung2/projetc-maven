import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import {
  ActionSwitching,
  ActionSwitchingConfig,
  ConfigStaticDataSource,
  DataSourceService,
  ExpressionTree,
  Flow,
  FlowQuery,
  FunctionOperator,
  FunctionService,
  GetDataSourceReq,
  OptionSwitching,
  OutputContextVariable,
  RenderDirectiveType,
  TypeOperator,
  VariableForAction
} from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { generateUUID } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { cloneDeep } from 'lodash';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'b3n-def-action-switching',
  templateUrl: './def-action-switching.component.html',
  styleUrls: ['./def-action-switching.component.scss']
})
export class DefActionSwitchingComponent implements OnInit {
  @Input() contextVariables: VariableForAction[];
  @Input() actionDetail: ActionSwitching;
  @Input() disabledEdit: boolean;
  @Output() changeConfigs = new EventEmitter<ActionSwitchingConfig>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  readonly typeOperator = TypeOperator;
  RenderDirectiveType = RenderDirectiveType;

  flow: Flow;
  editable: boolean;
  operators: FunctionOperator[];
  dataSourceUuids: string[] = [];
  formConfigs: UntypedFormGroup;

  get expressionMappings(): UntypedFormArray {
    return this.formConfigs.get('expressionMappings') as UntypedFormArray;
  }

  get hasDefaultPathCtrl(): UntypedFormControl {
    return this.formConfigs.get('hasDefaultPathCtrl') as UntypedFormControl;
  }

  get defaultPath(): UntypedFormGroup {
    return this.formConfigs.get('defaultPath') as UntypedFormGroup;
  }

  getErrorInput(ctrl: UntypedFormControl | AbstractControl) {
    return Utils.getErrorInput(ctrl);
  }

  constructor(
    private fb: UntypedFormBuilder,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private flowQuery: FlowQuery,
    private functionService: FunctionService,
    private dataSourceService: DataSourceService
  ) {}

  ngOnInit(): void {
    this.flow = this.flowQuery.getValue();
    this.editable = this.flow.editable && !this.disabledEdit;
    const pathIdInit = generateUUID();

    this.functionService.getFunctionOperators().subscribe(operators => {
      this.operators = operators;

      if (this.actionDetail) {
        const configs = this.actionDetail.configs;
        const expressionMappings = this.fb.array([]);

        configs.options.forEach(item => {
          if (!item.isDefault && Object.prototype.hasOwnProperty.call(configs.expressionMappings, item.pathId)) {
            const conditionForOr = this.fb.array([]);

            configs.expressionMappings[item.pathId].forEach(expressionMapping => {
              const conditionForAnd = this.fb.array([]);

              expressionMapping.forEach(control => {
                const token = control.type.substring('function - '.length, control.type.length);
                const isOnlyOneParameter =
                  token === TypeOperator.isNull ||
                  token === TypeOperator.isNotNull ||
                  token === TypeOperator.isTrue ||
                  token === TypeOperator.isFalse;

                const dataType = Utils.getDataTypeFromExpression(control.arguments[0], this.contextVariables);
                const dataTypeFake = Utils.getDataTypeFromExpression(control.arguments[0], this.contextVariables, true);
                const operators = this.getInitOperator(dataType);
                const contextVariablesArgument2 = this.getInitContextVariable(this.contextVariables, dataTypeFake);

                const selectionDataSourceUuid = this.getSelectionDataSource(
                  control.arguments[0],
                  this.contextVariables
                );
                if (selectionDataSourceUuid) {
                  this.addDtsToArr(selectionDataSourceUuid);
                }

                const arg = this.fb.group({
                  argument1: this.fb.group({
                    title: 'Control Variable',
                    expressionTree: [control.arguments[0], Utils.validateExp({ required: true, dataType: 'all' })],
                    isOptional: false,
                    dataType: 'all',
                    disabled: !this.editable
                  }),
                  argument2: this.fb.group({
                    title: 'Control Variable',
                    expressionTree: [
                      isOnlyOneParameter ? null : control.arguments[1],
                      isOnlyOneParameter
                        ? null
                        : Utils.validateExp({
                            required: true,
                            dataType: dataTypeFake,
                            maxlength: ValidateStringMaxLength.USER_INPUT,
                            max: ValidateNumberValue.MAX,
                            min: ValidateNumberValue.MIN
                          })
                    ],
                    isOptional: false,
                    dataType: dataTypeFake,
                    disabled: !this.editable
                  }),
                  type: [{ value: token, disabled: !this.editable }, Validators.required],
                  operator: [operators],
                  contextVariablesArgument2: [contextVariablesArgument2],
                  selectionDataSourceUuidArgument2: [selectionDataSourceUuid]
                });
                conditionForAnd.push(arg);
              });
              conditionForOr.push(conditionForAnd);
            });
            expressionMappings.push(
              this.fb.group({
                pathId: item.pathId,
                temptitle: [
                  this.getTitlePath(item.pathId, configs.options),
                  Utils.validateInput({
                    required: true,
                    dataType: 'string',
                    maxlength: ValidateStringMaxLength.NAME_TITLE
                  })
                ],
                title: [{ value: this.getTitlePath(item.pathId, configs.options), disabled: !this.editable }],
                isDefault: false,
                isEdit: false,
                isExpanded: true,
                expressions: conditionForOr
              })
            );
          }
        });

        const defaultPath = configs.options.find(item => item.isDefault);

        this.formConfigs = this.fb.group({
          expressionMappings: expressionMappings,
          hasDefaultPathCtrl: !!defaultPath,
          defaultPath: this.fb.group({
            pathId: defaultPath ? defaultPath.pathId : '',
            temptitle: [
              defaultPath ? defaultPath?.title : 'Default Path',
              defaultPath
                ? Utils.validateInput({
                    required: true,
                    dataType: 'string',
                    maxlength: ValidateStringMaxLength.NAME_TITLE
                  })
                : null
            ],
            title: defaultPath ? defaultPath?.title : 'Default Path',
            isDefault: true,
            isEdit: false,
            isExpanded: true
          })
        });

        this.fetchSelections();
      } else {
        this.formConfigs = this.fb.group({
          expressionMappings: this.fb.array([
            this.fb.group({
              pathId: pathIdInit,
              temptitle: [
                'Path 1',
                Utils.validateInput({
                  required: true,
                  dataType: 'string',
                  maxlength: ValidateStringMaxLength.NAME_TITLE
                })
              ],
              title: 'Path 1',
              isDefault: false,
              isEdit: false,
              isExpanded: true,
              expressions: this.fb.array([
                this.fb.array([
                  this.fb.group({
                    argument1: this.fb.group({
                      title: 'Control Variable',
                      expressionTree: [null, Utils.validateExp({ required: true, dataType: 'all' })],
                      isOptional: false,
                      dataType: 'all',
                      disabled: false
                    }),
                    type: [{ value: '', disabled: true }, Validators.required],
                    argument2: null,
                    operator: [[]],
                    contextVariablesArgument2: [[]],
                    selectionDataSourceUuidArgument2: ['']
                  })
                ])
              ])
            })
          ]),
          hasDefaultPathCtrl: [false],
          defaultPath: this.fb.group({
            pathId: '',
            temptitle: [
              'Default Path',
              Utils.validateInput({
                required: true,
                dataType: 'string',
                maxlength: ValidateStringMaxLength.NAME_TITLE
              })
            ],
            title: 'Default Path',
            isDefault: true,
            isEdit: false,
            isExpanded: true
          })
        });
      }

      if (!this.editable) {
        this.formConfigs.disable();
      }

      setTimeout(() => {
        this.emitValue();
      });

      this.formConfigs.valueChanges.subscribe(() => {
        this.emitValue();
      });
    });
  }

  drop(event: CdkDragDrop<AbstractControl[]>) {
    Utils.moveItemInFormArray(this.expressionMappings, event.previousIndex, event.currentIndex);
    this.emitValue();
  }

  onExpanded(expMapping: UntypedFormGroup) {
    if (!expMapping.get('isEdit').value) {
      expMapping.get('isExpanded').setValue(!expMapping.get('isExpanded').value);
    }
  }

  collapseAll(index: number) {
    this.expressionMappings.controls.forEach(expMapping => {
      if (this.expressionMappings.controls.indexOf(expMapping) !== index) {
        expMapping.get('isExpanded').setValue(false);
        this.cdr.detectChanges();
      }
    });
    if (index > -1) {
      this.defaultPath.get('isExpanded').setValue(false);
    }
  }

  addConditional(type: TypeOperator, expression: UntypedFormArray) {
    const controls = this.fb.group({
      type: [{ value: '', disabled: true }, Validators.required],
      argument1: this.fb.group({
        title: 'Control Variable',
        expressionTree: [null, Utils.validateExp({ required: true, dataType: 'all' })],
        isOptional: false,
        dataType: 'all',
        disabled: false
      }),
      argument2: null,
      operator: [[]],
      contextVariablesArgument2: [[]],
      selectionDataSourceUuidArgument2: ['']
    });
    if (type === TypeOperator.and) {
      expression.push(controls);
    }

    if (type === TypeOperator.or) {
      expression.push(this.fb.array([controls]));
    }
  }

  editPathName(e: Event, expMapping: UntypedFormGroup, id: string) {
    e.stopPropagation();
    expMapping.get('isEdit').setValue(!expMapping.get('isEdit').value);
    setTimeout(() => {
      document.getElementById(id).focus();
    });
  }

  doneEditPathName(formGroup: UntypedFormGroup) {
    if (formGroup.get('temptitle').valid) {
      formGroup.get('isEdit').setValue(false);
    }
    formGroup.get('title').setValue(formGroup.get('temptitle').value);
  }

  removeConditional(
    expression: UntypedFormArray,
    indexOperatorAnd: number,
    expressionMapping: UntypedFormArray,
    indexOperatorOr: number
  ) {
    if (expressionMapping.value.length > 1 && expressionMapping.value[indexOperatorOr]?.length === 1) {
      expressionMapping.removeAt(indexOperatorOr);
    } else {
      expression.removeAt(indexOperatorAnd);
    }
  }

  addNewPath() {
    this.expressionMappings.controls.forEach(expressionMapping => {
      expressionMapping.get('isExpanded').setValue(false);
    });
    this.defaultPath.get('isExpanded').setValue(false);

    const pathId = generateUUID();
    this.expressionMappings.push(
      this.fb.group({
        pathId: pathId,
        temptitle: [
          `Path ${this.expressionMappings.length + 1}`,
          Utils.validateInput({
            required: true,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.NAME_TITLE
          })
        ],
        title: `Path ${this.expressionMappings.length + 1}`,
        isDefault: false,
        isEdit: false,
        isExpanded: true,
        expressions: this.fb.array([
          this.fb.array([
            this.fb.group({
              type: [{ value: '', disabled: true }, Validators.required],
              argument1: this.fb.group({
                title: 'Control Variable',
                expressionTree: [null, Utils.validateExp({ required: true, dataType: 'all' })],
                isOptional: false,
                dataType: 'all',
                disabled: false
              }),
              argument2: null,
              operator: [[]],
              contextVariablesArgument2: [[]],
              selectionDataSourceUuidArgument2: ['']
            })
          ])
        ])
      })
    );
  }

  removePath(index: number, isDefaultPath: boolean = false) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        data: <ConfirmDialogInput>{
          title: 'Remove Path',
          message: `Are you sure to remove this path?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          if (!isDefaultPath) {
            this.expressionMappings.removeAt(index);
          } else {
            this.hasDefaultPathCtrl.setValue(false);
            this.formConfigs.setControl(
              'defaultPath',
              this.fb.group({
                value: [[]],
                pathId: [],
                temptitle: [
                  'Default Path',
                  Utils.validateInput({
                    required: true,
                    dataType: 'string',
                    maxlength: ValidateStringMaxLength.NAME_TITLE
                  })
                ],
                title: 'Default Path',
                isDefault: true,
                isEdit: false,
                isExpanded: true
              })
            );
          }
        } else {
          if (isDefaultPath) {
            this.hasDefaultPathCtrl.setValue(true);
          }
        }
      });
  }

  onChangeDefaultPath(checked: boolean) {
    if (checked) {
      const pathId = generateUUID();
      this.defaultPath.get('pathId').setValue(pathId);
      this.defaultPath.get('temptitle').setValidators(
        Utils.validateInput({
          required: true,
          dataType: 'string',
          maxlength: ValidateStringMaxLength.NAME_TITLE
        })
      );
      this.defaultPath.get('temptitle').updateValueAndValidity();
      this.defaultPath.get('title').setValue('Default Path');
      this.defaultPath.get('isEdit').setValue(false);
      this.defaultPath.get('isExpanded').setValue(true);
    } else {
      this.removePath(0, true);
    }
  }

  onChangeOperator(expression: UntypedFormGroup, event: MatSelectChange) {
    if (
      event.value === TypeOperator.isNotNull ||
      event.value === TypeOperator.isNull ||
      event.value === TypeOperator.isTrue ||
      event.value === TypeOperator.isFalse
    ) {
      expression.get('argument2.expressionTree').setValue(null);
      expression.get('argument2.expressionTree').setValidators(null);
    } else {
      expression.get('argument2.expressionTree').setValidators(
        Utils.validateExp({
          required: true,
          dataType: expression.get('argument2.dataType').value,
          maxlength: ValidateStringMaxLength.USER_INPUT,
          max: ValidateNumberValue.MAX,
          min: ValidateNumberValue.MIN
        })
      );
    }
    expression.get('argument2.expressionTree').updateValueAndValidity();
  }

  selectFirstParams(expression: UntypedFormGroup, event: OutputContextVariable) {
    if (event && !!event?.data) {
      expression.get('argument1.expressionTree').setValue(event.data);

      const dataType = event.dataType;
      const dataTypeFake = dataType === 'array' ? event.arrayItemDataType : dataType;

      const contextVariables = cloneDeep(this.contextVariables).filter(item => {
        item.properties = item.properties.filter(x => x.dataType === dataTypeFake);
        item.functionVariable = item.functionVariable?.filter(x => x.returnType === dataTypeFake);
        if (item.properties.length || item.functionVariable?.length) {
          return item;
        }
        return null;
      });
      expression.get('contextVariablesArgument2').setValue(contextVariables);

      const operators = this.getInitOperator(dataType);
      expression.get('operator').setValue(operators);
      expression.get('type').setValue(operators[0].token);
      expression.get('type').enable();
      expression.setControl(
        'argument2',
        this.fb.group({
          title: 'Control Variable',
          expressionTree: [
            null,
            [
              Utils.validateExp({
                required: true,
                dataType: dataTypeFake,
                maxlength: ValidateStringMaxLength.USER_INPUT,
                max: ValidateNumberValue.MAX,
                min: ValidateNumberValue.MIN
              })
            ]
          ],
          isOptional: false,
          dataType: dataTypeFake,
          disabled: false
        })
      );

      if (dataType === 'boolean') {
        expression.get('argument2.expressionTree').setValue(null);
        expression.get('argument2.expressionTree').setValidators(null);
        expression.get('argument2.expressionTree').updateValueAndValidity();
      }

      const selectionDataSourceUuid = this.getSelectionDataSource(event.data, this.contextVariables);
      expression.get('selectionDataSourceUuidArgument2').setValue(selectionDataSourceUuid);

      if (selectionDataSourceUuid && !this.dataSourceUuids.find(uuid => uuid === selectionDataSourceUuid)) {
        const flow = this.flowQuery.getValue();
        const request = <GetDataSourceReq>{
          dataSourceUuid: selectionDataSourceUuid,
          flowUuid: flow.uuid,
          flowVersion: flow.version
        };
        this.dataSourceService.fetchSelections(request).subscribe();
      }
    } else {
      expression.get('argument1.expressionTree').setValue(null);
      expression.setControl('argument2', null);
      expression.get('selectionDataSourceUuidArgument2').setValue('');
      expression.get('type').setValue('');
      expression.get('type').disable();
    }
  }

  selectSecondParams(expression: UntypedFormGroup, event: OutputContextVariable) {
    if (event && !!event?.data) {
      expression.get('argument2.expressionTree').setValue(event.data);
    } else {
      expression.get('argument2.expressionTree').setValue(null);
    }
  }

  private getSelectionDataSource(expressionTree: ExpressionTree, contextvariables: VariableForAction[]): string {
    const properties = cloneDeep(contextvariables)
      .map(ctx =>
        ctx.properties.find(pro => {
          if (Utils.compareObject(pro.expressionTree, expressionTree)) {
            return pro;
          }
          return null;
        })
      )
      .filter(x => x);
    return properties?.length ? properties[0].selectionDataSourceUuid : '';
  }

  private getInitOperator(dataType: string) {
    const operators = this.operators.filter(
      item =>
        (item.arguments[0].dataType === dataType ||
          item.token === TypeOperator.equal ||
          item.token === TypeOperator.notEqual ||
          item.token === TypeOperator.isNull ||
          item.token === TypeOperator.isNotNull) &&
        item.token !== TypeOperator.or &&
        item.token !== TypeOperator.and
    );
    switch (dataType) {
      case 'boolean':
        return operators.filter(item => item.token !== TypeOperator.equal && item.token !== TypeOperator.notEqual);
      case 'array':
        return operators.filter(
          item =>
            item.arguments[0].dataType === dataType ||
            item.token === TypeOperator.isNull ||
            item.token === TypeOperator.isNotNull
        );
      default:
        return operators;
    }
  }

  private getInitContextVariable(contextVariable: VariableForAction[], dataType: string) {
    const variablesFilter = cloneDeep(contextVariable).filter(ctx => {
      ctx.properties = ctx.properties.filter(x => x.dataType === dataType);
      ctx.functionVariable = ctx.functionVariable?.filter(x => x.returnType === dataType);
      if (ctx.properties?.length || ctx.functionVariable?.length) {
        return ctx;
      }
      return '';
    });

    return variablesFilter;
  }

  private getTitlePath(pathId: string, options: OptionSwitching[]) {
    return options.find(item => item.pathId === pathId)?.title;
  }

  private addDtsToArr(uuid: string) {
    if (!this.dataSourceUuids.find(dtsUuid => dtsUuid === uuid)) {
      this.dataSourceUuids.push(uuid);
    }
  }

  private fetchSelections() {
    const linkApi: Observable<ConfigStaticDataSource[]>[] = [];
    this.dataSourceUuids.forEach(uuid => {
      const request = <GetDataSourceReq>{
        dataSourceUuid: uuid,
        flowUuid: this.flow.uuid,
        flowVersion: this.flow.version
      };
      linkApi.push(this.dataSourceService.fetchSelections(request));
    });
    forkJoin(linkApi).subscribe();
  }

  private emitValue() {
    if (this.formConfigs.valid) {
      const formData = this.formConfigs.getRawValue();
      const expressionMappings = {};
      const options = [];
      formData.expressionMappings?.forEach(expressionMapping => {
        const conditionsOr = [];
        options.push({
          title: expressionMapping.title,
          pathId: expressionMapping.pathId,
          isDefault: expressionMapping.isDefault
        });

        expressionMapping?.expressions?.forEach(expression => {
          const conditionAnd = [];
          expression?.forEach(control => {
            let args = [];
            if (
              control.type === TypeOperator.isNull ||
              control.type === TypeOperator.isNotNull ||
              control.type === TypeOperator.isTrue ||
              control.type === TypeOperator.isFalse
            ) {
              args = [{ ...control?.argument1?.expressionTree }];
            } else {
              args = [{ ...control?.argument1?.expressionTree }, { ...control?.argument2?.expressionTree }];
            }
            const condition = {
              type: `function - ${control.type}`,
              arguments: args
            };
            conditionAnd.push(condition);
          });
          conditionsOr.push(conditionAnd);
        });
        expressionMappings[expressionMapping.pathId] = conditionsOr;
      });

      if (this.hasDefaultPathCtrl.value) {
        options.push(this.defaultPath.value);
      }

      const configs = {
        expressionMappings,
        options: options
      };
      this.changeConfigs.emit(configs);
      this.invalid.emit(false);
    } else {
      this.invalid.emit(true);
    }
  }
}
