import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {
  ExpressionTree,
  OptionForControl,
  PropertyForVariable,
  SubTypeVariable,
  VariableForAction
} from '@b3networks/api/flow';
import Fuse from 'fuse.js';
import { cloneDeep } from 'lodash';
import { ValidateNumberValue, ValidateStringMaxLength } from '../../app-state/app-state.model';
import { Utils } from '../../utils';

@Component({
  selector: 'b3n-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.scss']
})
export class ContextMenuComponent implements OnInit {
  @Input() contextVariables: VariableForAction[];
  @Input() optionForControl: OptionForControl;
  @Output() selectProp = new EventEmitter<PropertyForVariable>();
  @Output() selectFunc = new EventEmitter<ExpressionTree>();

  selectedActions: VariableForAction[] = [];
  searchAction = new UntypedFormControl();
  filteredActions: VariableForAction[];

  selectedProperties: PropertyForVariable[] = [];
  searchProperty = new UntypedFormControl();
  filteredProperties: PropertyForVariable[];

  allPropertiesOfAction: PropertyForVariable[] = [];
  suggestionProperties: PropertyForVariable[] = [];

  showFunctionVariable: boolean;
  form: UntypedFormGroup;

  compareAction = (o1: VariableForAction, o2: VariableForAction) => o1.index === o2.index;

  compareProp = (o1: PropertyForVariable, o2: PropertyForVariable) => o1.expressionTree === o2.expressionTree;

  get functions(): UntypedFormArray {
    return this.form.get('functions') as UntypedFormArray;
  }

  get selectedFunctionVariable() {
    return this.form.get('selectedFunctionVariable');
  }

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      functions: this.fb.array([]),
      selectedFunctionVariable: []
    });

    this.filteredActions = this.getContextVariables();
    this.suggestionProperties = this.createOptionSuggestion();

    this.searchAction.valueChanges.subscribe(val => {
      this.filteredActions = this.contextVariables.filter(
        c => c.actionName.toLowerCase().indexOf(val.toLowerCase()) >= 0 && c.properties.length > 0
      );
      this.selectedActions.length = 0;
    });

    this.searchProperty.valueChanges.subscribe(val => {
      this.filteredProperties = this.selectedActions[0].properties.filter(
        p => p.title.toLowerCase().indexOf(val.toLowerCase()) >= 0
      );
      this.selectedProperties.length = 0;
    });
  }

  selectAction() {
    if (this.selectedActions[0].actionName === 'Function') {
      this.selectedActions[0].functionVariable = this.selectedActions[0].functionVariable.filter(
        funVar => funVar.returnType === this.optionForControl.dataType
      );
      this.selectedFunctionVariable.setValue(this.selectedActions[0].functionVariable[0]);
      if (this.selectedFunctionVariable.value.arguments) {
        this.functions.clear();
        this.selectedFunctionVariable.value.arguments.forEach(item => {
          this.functions.push(
            this.fb.group({
              title: item.name,
              expressionTree: [
                null,
                Utils.validateExp({
                  required: true,
                  dataType: item.dataType,
                  maxlength: ValidateStringMaxLength.USER_INPUT,
                  max: ValidateNumberValue.MAX,
                  min: ValidateNumberValue.MIN
                })
              ],
              type: item.type,
              label: '',
              dataType: item.dataType
            })
          );
        });
      }
      this.showFunctionVariable = true;
    } else {
      this.filteredProperties = this.selectedActions[0].properties;
      this.selectedProperties.length = 0;
    }
  }

  selectProperty(e?: PropertyForVariable) {
    this.selectProp.emit(e ? e : this.selectedProperties[0]);
  }

  private getContextVariables() {
    return cloneDeep(this.contextVariables).filter(item => {
      item.properties = item.properties.filter(x => x.dataType === this.optionForControl.dataType);
      item.functionVariable = item.functionVariable?.filter(x => x.returnType === this.optionForControl.dataType);
      if (item.properties.length || item.functionVariable?.length) {
        return item;
      }
      return null;
    });
  }

  private createOptionSuggestion() {
    this.allPropertiesOfAction.length = 0;
    this.contextVariables?.forEach(i => {
      i.properties.forEach(j => {
        if (j.dataType === this.optionForControl.dataType) {
          this.allPropertiesOfAction.push(j);
        }
      });
    });

    let data = [];
    if (this.optionForControl.title?.length) {
      const options = { keys: ['title'], includeScore: true, threshold: 0.3 };
      const fuse = new Fuse(this.allPropertiesOfAction, options);

      data = fuse.search(this.optionForControl.title).map(r => r.item);
    }

    return data?.slice(0, 3);
  }

  backToContextVariables() {
    this.showFunctionVariable = false;
    this.selectedActions.length = 0;
  }

  onChangeFunctionVariable() {
    this.functions.clear();

    if (this.selectedFunctionVariable?.value?.arguments.length) {
      this.selectedFunctionVariable.value.arguments.forEach(item => {
        this.functions.push(
          this.fb.group({
            title: item.name,
            expressionTree: ['', Validators.required],
            type: item.type,
            label: '',
            dataType: item.dataType
          })
        );
      });
    }
  }

  selectParams(event, func: UntypedFormGroup) {
    func.get('expressionTree').setValue(event?.data);
  }

  private isContextFormVariable(type: string) {
    return (
      type === SubTypeVariable.ActionResponseExp ||
      type === SubTypeVariable.ExecutionVarExp ||
      type === SubTypeVariable.ConnectorUserParamsExp ||
      type === SubTypeVariable.TriggerOutputExp ||
      type === SubTypeVariable.FlowStaticVarExp ||
      type === SubTypeVariable.UserPropertiesVarExp
    );
  }

  private getLabelFormContext(expressionTree: ExpressionTree): string {
    if (this.contextVariables) {
      const properties = cloneDeep(this.contextVariables)
        .map(ctx =>
          ctx.properties.find(pro => {
            if (Utils.compareObject(pro.expressionTree, expressionTree)) {
              return pro;
            }
            return null;
          })
        )
        .filter(x => x);
      if (properties?.length) {
        return properties[0].actionNameAndTitle;
      }
    }

    return '';
  }

  private getLabelFunction(argumentsFunc: ExpressionTree[] = [], array: any[]) {
    argumentsFunc?.forEach(item => {
      if (this.isContextFormVariable(item.type)) {
        const value = this.getLabelFormContext(item);
        if (value?.length) {
          array.push(value);
        }
      } else if (item.type.startsWith('function') && item.arguments?.length) {
        if (item.label?.length) {
          array.push(item.label);
        } else {
          this.getLabelFunction(item.arguments, array);
        }
      } else {
        array.push(item.value);
      }
    });
  }

  onApply() {
    if (this.selectedActions[0]?.functionVariable.length) {
      const expressionTrees = [];
      const labels = [];

      if (this.functions.value.length) {
        this.functions.value.forEach(item => {
          if (this.isContextFormVariable(item.expressionTree?.type)) {
            const value = this.getLabelFormContext(item.expressionTree);
            if (value?.length) {
              labels.push(value);
            }
          } else if (item.expressionTree?.arguments) {
            if (item.expressionTree.label?.length) {
              labels.push(`${item.expressionTree.label}`);
            } else {
              const labelsTemp = [];
              this.getLabelFunction(item.expressionTree.arguments, labelsTemp);
              if (labelsTemp.length > 1) {
                labels.push(`(${labelsTemp})`);
              } else {
                labels.push(`${labelsTemp}`);
              }
            }
          } else {
            labels.push(item.expressionTree.value);
          }
          expressionTrees.push(item.expressionTree);
        });
      }
      this.selectFunc.emit({
        type: `function - ${this.selectedFunctionVariable.value?.token}`,
        arguments: expressionTrees,
        label: `Function: ${this.selectedFunctionVariable.value?.name}(${labels})`
      });
    }
  }
}
