import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  ActionApiConfig,
  ActionSharedVariableConfig,
  ActionsService,
  ActionSubroutineConfig,
  ActionSwitchingConfig,
  ActionTransformConfig,
  ActionType,
  DeleteActionReq,
  Dependency,
  DependencyAction,
  ExpressionTree,
  Flow,
  FlowQuery,
  FlowService,
  GetVariablesReq,
  PropertyForVariable,
  ReplaceActionReq,
  ResolveDependencyInput,
  TriggerService,
  VariableForAction
} from '@b3networks/api/flow';
import {
  AppName,
  AppStateQuery,
  Utils,
  ValidateNumberValue,
  ValidateStringMaxLength
} from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { forkJoin, Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

export interface ResolveDependencyOutput {
  isDependency: boolean;
  dependencies: DependencyAction[];
  newTriggerOutputProperties?: PropertyForVariable[];
  newActionOutputProperties?: PropertyForVariable[];
}

@Component({
  selector: 'b3n-resolve-dependency',
  templateUrl: './resolve-dependency.component.html',
  styleUrls: ['./resolve-dependency.component.scss']
})
export class ResolveDependencyComponent implements OnInit {
  @Input() resolveDependencyInput: ResolveDependencyInput;
  @Output() resultResolve = new EventEmitter<ResolveDependencyOutput>();

  flow: Flow;
  contextVariables: VariableForAction[] = [];
  variableForActionCustom: VariableForAction;
  formGroup: UntypedFormGroup;
  isLoading: boolean;
  uiConfig = [];

  get dependencies(): UntypedFormArray {
    return this.formGroup.get('dependencies') as UntypedFormArray;
  }

  constructor(
    private fb: UntypedFormBuilder,
    private flowQuery: FlowQuery,
    private flowService: FlowService,
    private triggerService: TriggerService,
    private actionsService: ActionsService,
    private appStateQuery: AppStateQuery,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.flow = this.flowQuery.getValue();
    this.formGroup = this.fb.group({
      dependencies: this.fb.array([])
    });
    this.initForm();
  }

  private initForm() {
    const {
      dependencys = [],
      action,
      replaceActionData,
      replace,
      isTrigger,
      isExtendTrigger,
      newTriggerOutputProperties,
      newActionOutputProperties
    } = this.resolveDependencyInput;

    const variableActionReq: GetVariablesReq = {
      flowUuid: this.flow.uuid,
      flowVersion: this.flow.version,
      currentActionUuid: isTrigger ? null : action.actionUuid
    };

    this.flowService.getContextVariables(variableActionReq).subscribe(contextVariables => {
      const contextForEveryAction$: Observable<VariableForAction[]>[] = [];
      dependencys.forEach(item => {
        const usedResponseExpressionTrees = [...new Set(item.usedResponseExpressionTrees)];
        usedResponseExpressionTrees.forEach(expressionTree => {
          if (expressionTree) {
            const indexExpression = this.uiConfig.findIndex(x =>
              Utils.compareObject(x?.originExpressionTree, expressionTree)
            );

            if (indexExpression === -1) {
              this.uiConfig.push({
                originExpressionTree: expressionTree,
                currentExpressionTree: '',
                contextVariablesOrigin: [],
                contextVariables: [],
                countActionUsed: 1,
                actionUuid: item.uuid,
                dataType: 'string'
              });
            } else {
              this.uiConfig[indexExpression].countActionUsed++;
            }
          }
        });
      });

      this.uiConfig.forEach(item => {
        const request: GetVariablesReq = {
          flowUuid: this.flow.uuid,
          flowVersion: this.flow.version,
          prevActionUuid: item.actionUuid
        };
        contextForEveryAction$.push(this.flowService.getContextVariables(request));
      });

      forkJoin(contextForEveryAction$).subscribe(data => {
        if (replace) {
          if (isTrigger) {
            contextVariables = contextVariables.map(item => {
              if (item.type === 'TRIGGER') {
                if (!isExtendTrigger) {
                  item.actionName = this.resolveDependencyInput.newTriggerName;
                }
                newTriggerOutputProperties?.forEach(triggerOutput => {
                  triggerOutput.actionNameAndTitle = `${item.number}. ${item.actionName}: ${triggerOutput.title}`;
                });
                item.properties = newTriggerOutputProperties;
              }
              return item;
            });
          } else {
            let actionOutputProperties = newActionOutputProperties;

            actionOutputProperties?.forEach(actionOutput => {
              actionOutput.actionNameAndTitle = `${replaceActionData.body.name}: ${actionOutput.title}`;
            });

            const {
              body: { type }
            } = replaceActionData;
            if (
              replaceActionData?.body?.['outputFilter'] &&
              (type === ActionType.API || type === ActionType.SUBROUTINE_CALL)
            ) {
              actionOutputProperties = actionOutputProperties?.filter(
                item => replaceActionData?.body?.['outputFilter']?.selectivePaths?.indexOf(item.path) !== -1
              );
            }

            this.variableForActionCustom = <VariableForAction>{
              index: 0,
              actionName: replaceActionData.body.name,
              number: null,
              type: 'VARIABLE_CUSTOM',
              properties: [...actionOutputProperties]
            };
          }
        }

        this.uiConfig.forEach((item, index) => {
          item.contextVariablesOrigin = data[index];
          let dataType = 'string';

          let prop: PropertyForVariable;
          data[index].forEach(ctx =>
            ctx.properties.find(pro => {
              if (Utils.compareObject(pro.expressionTree, item.originExpressionTree)) {
                prop = pro;
              } else {
                pro.arrayItems?.find(p => {
                  if (Utils.compareObject(p.expressionTree, item.originExpressionTree)) {
                    prop = p;
                  }
                });
              }
            })
          );
          if (prop) {
            dataType = prop.dataType;
          }

          item.dataType = dataType;

          let variablesFilter = cloneDeep(contextVariables);

          if (!isTrigger && replace && !!this.variableForActionCustom) {
            variablesFilter.unshift(cloneDeep(this.variableForActionCustom));
          }

          variablesFilter = variablesFilter?.filter(ctx => {
            ctx.properties = ctx.properties?.filter(x => x.dataType === dataType);
            ctx.functionVariable = ctx.functionVariable?.filter(f => f.returnType === dataType);
            if (ctx.properties?.length || ctx.functionVariable?.length) {
              return ctx;
            }
            return null;
          });

          item.contextVariables = variablesFilter;
        });

        const dependencies: UntypedFormGroup[] = [];
        this.uiConfig.forEach(item => {
          const controls = this.fb.group({
            originExpressionTree: [item.originExpressionTree],
            currentExpressionTree: [
              item.currentExpressionTree,
              Utils.validateExp({
                required: true,
                dataType: item.dataType,
                maxlength: ValidateStringMaxLength.USER_INPUT,
                max: ValidateNumberValue.MAX,
                min: ValidateNumberValue.MIN
              })
            ]
          });
          dependencies.push(controls);
        });
        this.formGroup = this.fb.group({
          dependencies: this.fb.array(dependencies)
        });
      });
    });
  }

  selectValueOfConfig(form: UntypedFormGroup, event) {
    delete event?.data?.label;
    form.get('currentExpressionTree').setValue(event?.data);
  }

  confirm() {
    if (this.formGroup.valid) {
      if (this.resolveDependencyInput.isTrigger) {
        if (this.resolveDependencyInput.isExtendTrigger) {
          this.resolveDependencyForExtendTrigger();
        } else {
          this.resolveDependencyForTrigger();
        }
      } else {
        this.resolveDependencyForAction();
      }
    }
  }

  private resolveDependencyForAction() {
    const { action, replace } = this.resolveDependencyInput;

    const isBuildIn = action.type === ActionType.SWITCHING;

    if (replace) {
      this.replaceAction(isBuildIn);
      return;
    }

    this.safeDeleteAction(isBuildIn);
  }

  private replaceAction(isBuildIn: boolean) {
    const dependenciesFromFromGroup = this.formGroup.getRawValue();
    const { pathId2Keep, replaceActionData, newActionUuid } = this.resolveDependencyInput;
    const dependants = this.getDependencyHasBeenResolve(dependenciesFromFromGroup);

    const requestBody = <ReplaceActionReq>{
      ...replaceActionData
    };

    requestBody.body['dependencyUpdateRequest'] = {
      dependants
    };

    if (isBuildIn) {
      requestBody.body['dependencyUpdateRequest']['pathId2Keep'] = pathId2Keep;
    }

    if (newActionUuid) {
      requestBody.body['newActionUuid'] = newActionUuid;
    }

    this.isLoading = true;
    this.actionsService
      .replaceAction(requestBody, this.appStateQuery.getName() === AppName.PROGRAMMABLE_FLOW)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: res => {
          if (res?.dependencies?.length) {
            this.resultResolve.emit({
              isDependency: true,
              dependencies: res?.dependencies,
              newActionOutputProperties: res?.newActionOutputProperties
            });
          } else {
            this.resultResolve.emit(<ResolveDependencyOutput>{ isDependency: false });
          }
        },
        error: error => {
          this.toastService.error(error.message);
        }
      });
  }

  private resolveDependencyForTrigger() {
    const dependenciesFromFromGroup = this.formGroup.getRawValue();
    const { replaceTriggerData } = this.resolveDependencyInput;
    const dependants = this.getDependencyHasBeenResolve(dependenciesFromFromGroup);

    replaceTriggerData['dependantsUpdateRequest'] = {
      ...dependants
    };

    this.isLoading = true;
    this.triggerService
      .replaceTrigger(this.flow.uuid, this.flow.version, replaceTriggerData)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: res => {
          if (res?.dependencies?.length) {
            this.resultResolve.emit(<ResolveDependencyOutput>{
              isDependency: true,
              dependencies: res.dependencies,
              newTriggerOutputProperties: res.newTriggerOutputProperties
            });
          } else {
            this.resultResolve.emit(<ResolveDependencyOutput>{ isDependency: false });
          }
        },
        error: error => {
          this.toastService.error(error.message);
        }
      });
  }

  private resolveDependencyForExtendTrigger() {
    const dependenciesFromFromGroup = this.formGroup.getRawValue();
    const { extendTriggerData } = this.resolveDependencyInput;
    const dependants = this.getDependencyHasBeenResolve(dependenciesFromFromGroup);

    extendTriggerData['dependantsUpdateRequest'] = {
      ...dependants
    };

    this.isLoading = true;
    this.triggerService
      .extendTrigger(this.flow.uuid, this.flow.version, extendTriggerData)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: res => {
          if (res?.dependencies?.length) {
            this.resultResolve.emit(<ResolveDependencyOutput>{
              isDependency: true,
              dependencies: res.dependencies,
              newTriggerOutputProperties: res.newTriggerOutputProperties
            });
          } else {
            this.resultResolve.emit(<ResolveDependencyOutput>{ isDependency: false });
          }
        },
        error: error => {
          this.toastService.error(error.message);
        }
      });
  }

  private safeDeleteAction(isBuildIn: boolean) {
    const dependenciesFromFromGroup = this.formGroup.getRawValue();
    const { action, pathId2Keep } = this.resolveDependencyInput;

    const dependants = this.getDependencyHasBeenResolve(dependenciesFromFromGroup);

    const body = {
      dependants: dependants
    };

    if (isBuildIn) {
      body['pathId2Keep'] = pathId2Keep;
    }

    const request: DeleteActionReq = {
      actionUuid: action.actionUuid,
      flowUuid: this.flow.uuid,
      version: this.flow.version,
      body
    };

    this.isLoading = true;

    this.actionsService
      .safeDeleteAction(request)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: res => {
          if (res?.dependencies?.length) {
            this.resultResolve.emit(<ResolveDependencyOutput>{
              isDependency: true,
              dependencies: res.dependencies,
              newActionOutputProperties: res.newActionOutputProperties
            });
          } else {
            this.resultResolve.emit(<ResolveDependencyOutput>{ isDependency: false });
          }
        },
        error: error => {
          this.toastService.error(error.message);
        }
      });
  }

  private getDependencyHasBeenResolve(dependenciesFromFromGroup) {
    const dependencysActions = cloneDeep(this.resolveDependencyInput.dependencys as DependencyAction[]);
    const dependants = {};

    dependencysActions.forEach(item => {
      let configs = item.configs;

      switch (item.type) {
        case ActionType.API:
        case ActionType.EXTERNAL:
          configs = <ActionApiConfig>item.configs;
          if (configs.urlMappings.length) {
            configs.urlMappings = this.getConfigDependency(configs, dependenciesFromFromGroup, 'urlMappings');
          }
          if (configs.headersMappings.length) {
            configs.headersMappings = this.getConfigDependency(configs, dependenciesFromFromGroup, 'headersMappings');
          }
          if (configs.bodyMappings.length) {
            configs.bodyMappings = this.getConfigDependency(configs, dependenciesFromFromGroup, 'bodyMappings');
          }
          if (configs.extendedMappings?.length) {
            configs.extendedMappings = this.getConfigDependency(configs, dependenciesFromFromGroup, 'extendedMappings');
          }
          break;

        case ActionType.SUBROUTINE_CALL:
        case ActionType.SUBROUTINE_RETURN:
          configs = <ActionSubroutineConfig>item.configs;
          if (configs.mappings && configs.mappings.length) {
            configs.mappings = this.getConfigDependency(configs, dependenciesFromFromGroup, 'mappings');
          }
          break;

        case ActionType.SWITCHING:
          configs = <ActionSwitchingConfig>item.configs;
          Object.keys(configs.expressionMappings)?.forEach(key => {
            if (Object.prototype.hasOwnProperty.call(configs?.['expressionMappings'], key)) {
              configs['expressionMappings'][key]?.forEach(expressionMapping => {
                expressionMapping?.forEach(expression => {
                  expression?.arguments?.forEach((expressionTree, index) => {
                    dependenciesFromFromGroup.dependencies?.forEach(x => {
                      if (Utils.compareObject(expressionTree, x.originExpressionTree)) {
                        expression['arguments'][index] = x.currentExpressionTree;
                      }
                    });
                  });
                });
              });
            }
          });
          break;

        case ActionType.TRANSFORM:
          configs = <ActionTransformConfig>item.configs;
          configs.transformFunction.arguments?.forEach((expressionTree, index) => {
            dependenciesFromFromGroup.dependencies?.forEach(x => {
              if (Utils.compareObject(expressionTree, x.originExpressionTree)) {
                configs['transformFunction']['arguments'][index] = x.currentExpressionTree;
              }
            });
          });
          break;

        case ActionType.SET_SHARED_VARIABLE:
        case ActionType.GET_SHARED_VARIABLE:
        case ActionType.PUSH_SHARED_VARIABLE:
        case ActionType.POP_SHARED_VARIABLE:
        case ActionType.INCREMENT_SHARED_VARIABLE:
          configs = <ActionSharedVariableConfig>item.configs;
          dependenciesFromFromGroup.dependencies?.forEach(x => {
            if (Utils.compareObject(item.configs['dynVariableName'], x.originExpressionTree)) {
              configs['dynVariableName'] = x.currentExpressionTree;
            }
            if (item.configs['value']) {
              if (Utils.compareObject(item.configs['value'], x.originExpressionTree)) {
                configs['value'] = x.currentExpressionTree;
              }
            }
          });
          break;
      }

      dependants[item.uuid] = <Dependency>{
        name: item.name,
        configs: configs
      };
    });

    return dependants;
  }

  private setExpression(expArguments: ExpressionTree[], item) {
    if (expArguments?.length) {
      expArguments.forEach((exp, index) => {
        if (Utils.compareObject(exp, item.originExpressionTree)) {
          expArguments[index] = item.currentExpressionTree;
        } else {
          if (exp.arguments?.length) {
            this.setExpression(exp.arguments, item);
          }
        }
      });
    }
  }

  private getConfigDependency(configs, dependenciesFromFromGroup, location: string) {
    const data = cloneDeep(configs);
    if (data[location] && data[location]?.length) {
      data[location].forEach(body => {
        dependenciesFromFromGroup.dependencies.forEach(item => {
          if (body?.expressionTree) {
            if (Utils.compareObject(body.expressionTree, item.originExpressionTree)) {
              body.expressionTree = item.currentExpressionTree;
            } else {
              if (body.expressionTree?.arguments?.length) {
                this.setExpression(body.expressionTree.arguments, item);
              }
            }
          }

          if (location === 'extendedMappings') {
            if (body?.keyUsingExpressionTree) {
              if (Utils.compareObject(body.keyUsingExpressionTree, item.originExpressionTree)) {
                body.keyUsingExpressionTree = item.currentExpressionTree;
              }
            }
          }
        });

        if (location === 'bodyMappings' && body.arrayItemsMappings?.length) {
          body.arrayItemsMappings.forEach(itemMappings => {
            itemMappings.forEach(itemMapping => {
              dependenciesFromFromGroup.dependencies.forEach(item => {
                if (itemMapping.expressionTree) {
                  if (Utils.compareObject(itemMapping.expressionTree, item.originExpressionTree)) {
                    itemMapping.expressionTree = item.currentExpressionTree;
                  } else {
                    if (itemMapping.expressionTree?.arguments?.length) {
                      this.setExpression(itemMapping.expressionTree.arguments, item);
                    }
                  }
                }
              });
            });
          });
        }
      });
    }

    return data[location];
  }
}
