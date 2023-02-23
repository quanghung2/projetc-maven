import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatChipList } from '@angular/material/chips';
import { MatMenuTrigger } from '@angular/material/menu';
import {
  ExpressionTree,
  OptionForControl,
  OutputContextVariable,
  PropertyForVariable,
  SubTypeVariable,
  VariableForAction
} from '@b3networks/api/flow';
import { cloneDeep } from 'lodash';
import { ReqValidate } from '../../app-state/app-state.model';
import { Utils } from '../../utils';

@Component({
  selector: 'b3n-value-type-others',
  templateUrl: './value-type-others.component.html',
  styleUrls: ['./value-type-others.component.scss']
})
export class ValueTypeOthersComponent implements OnInit, OnChanges {
  @ViewChild('chipList') chipList: MatChipList;
  @ViewChild('chipInput') chipInput: ElementRef<HTMLInputElement>;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @Input() optionForControl: OptionForControl;
  @Input() contextVariables: VariableForAction[];
  @Input() reqValidate: ReqValidate;
  @Output() expressionTree = new EventEmitter<OutputContextVariable>();

  inputCtrl = new UntypedFormControl();
  selectValues: string[] = [];
  checkboxCtrl = new UntypedFormControl();
  textError: string;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contextVariables'] && changes['contextVariables'].currentValue) {
      if (changes['contextVariables'].currentValue !== changes['contextVariables'].previousValue) {
        this.selectValues.length = 0;
        this.cdr.detectChanges();
      }
    }

    if (changes['optionForControl'] && !changes['optionForControl'].firstChange && this.chipList) {
      this.textError = Utils.getErrorExp(this.optionForControl.expressionTree, this.reqValidate);
      this.chipList.errorState = !!this.textError;
    }
  }

  ngOnInit(): void {
    this.inputCtrl.valueChanges.subscribe(value => {
      if (this.selectValues.length === 0) {
        if (!Number(value)) {
          this.emitData({ data: null });
        } else {
          this.emitData({
            data: { type: `value - number`, value: Number(value) },
            dataType: this.optionForControl.dataType
          });
        }
      }
    });

    this.checkboxCtrl.valueChanges.subscribe(val => {
      this.emitData({
        data: { type: `value - boolean`, value: val },
        dataType: 'boolean'
      });
    });

    this.initDataFromExpressionTree();

    if (this.optionForControl.disabled) {
      this.inputCtrl.disable({ emitEvent: false });
      this.checkboxCtrl.disable({ emitEvent: false });
    }
  }

  selectProperty(item: PropertyForVariable) {
    this.selectValues.length = 0;
    this.inputCtrl.setValue(null, { emitEvent: false });
    this.selectValues.push(item.actionNameAndTitle);
    this.emitData({ data: item.expressionTree, dataType: item.dataType });
    this.trigger.closeMenu();
  }

  selectFunction(item: ExpressionTree) {
    this.selectValues.length = 0;
    this.inputCtrl.setValue(null, { emitEvent: false });
    this.selectValues.push(item.label);
    this.emitData({
      data: item
      // dataType: this.selectedFunctionVariable.value?.returnType
    });
    this.trigger.closeMenu();
  }

  getRegex() {
    return Utils.getRegex(this.optionForControl.dataType);
  }

  remove(value: string): void {
    const index = this.selectValues.indexOf(value);
    this.selectValues.splice(index, 1);
    this.emitData({ data: null, type: '', dataType: '' });
  }

  private getLabelFunctionForInitData(
    argumentsFunc: ExpressionTree[] = [],
    itemExpression: ExpressionTree,
    isContext: boolean,
    indexOusight: number = 0,
    arrayOutsight: string[] = []
  ) {
    const getContext = (expression: ExpressionTree) => {
      const token = expression.type.substring(11, expression.type.length);

      const context = cloneDeep(this.contextVariables).find(ctx => {
        if (ctx.actionName === 'Function') {
          const functionVariable = ctx.functionVariable?.filter(item => item.token === token);
          if (functionVariable && functionVariable?.length) {
            ctx.functionVariable = functionVariable;
            return ctx;
          }
        }
        return null;
      });

      return context;
    };

    const context = getContext(itemExpression);

    if (context || isContext) {
      const params = [];

      argumentsFunc?.forEach(item => {
        if (this.isContextFormVariable(item.type)) {
          const value = this.getLabelFormContext(item);
          if (value?.length) {
            params.push(value);
          }
        } else if (item.type.startsWith('function')) {
          if (item.arguments?.length) {
            this.getLabelFunctionForInitData(item.arguments, item, true, indexOusight, params);
          } else {
            const context = getContext(item);

            if (context) {
              params.push(`${context.functionVariable[0].name}()`);
            }
          }
        } else {
          params.push(item.value);
        }
      });

      let label = '';

      if (context) {
        label = `Function: ${context.functionVariable[0].name}(${params})`;
      } else {
        label = params?.length > 1 ? `(${params})` : `${params}`;
      }

      arrayOutsight.push(label);
      this.selectValues.splice(indexOusight, 1);
      this.selectValues.push(arrayOutsight.length > 1 ? `(${arrayOutsight})` : `${arrayOutsight}`);
    } else {
      argumentsFunc?.forEach((item, index) => {
        indexOusight = index;
        if (this.isContextFormVariable(item.type)) {
          const label = this.getLabelFormContext(item);
          if (label?.length) {
            this.selectValues.push(label);
          }
        } else if (item.type.startsWith('function')) {
          if (item.arguments?.length) {
            this.getLabelFunctionForInitData(item.arguments, item, false, indexOusight);
          } else {
            const context = getContext(item);
            if (context) {
              this.selectValues.push(`${context.functionVariable[0].name}()`);
            }
          }
        } else {
          this.selectValues.push(item.value?.toString());
        }
      });
    }
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

  private getLabelFormContext(expressionTree: ExpressionTree): string {
    if (this.contextVariables) {
      let prop: PropertyForVariable;
      this.contextVariables.forEach(ctx =>
        ctx.properties.find(pro => {
          if (Utils.compareObject(pro.expressionTree, expressionTree)) {
            prop = pro;
          }
        })
      );
      if (prop) {
        return prop.actionNameAndTitle;
      }
    }
    return '';
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

  private emitData(event: OutputContextVariable) {
    if (event?.data) {
      this.removeLabelFunction(event.data.arguments);
    }
    if (this.reqValidate && this.chipList) {
      this.textError = Utils.getErrorExp(event.data, this.reqValidate);
      this.chipList.errorState = !!this.textError;
    }
    this.expressionTree.emit(event);
  }

  private removeLabelFunction(argumentsFunc: ExpressionTree[] = []) {
    argumentsFunc?.forEach(item => {
      if (item.type.startsWith('function')) {
        this.removeLabelFunction(item.arguments);
        delete item.label;
      }
    });
  }

  private initDataFromExpressionTree() {
    const expressionTree = this.optionForControl.expressionTree;

    //initData
    if (expressionTree) {
      if (this.isContextFormVariable(expressionTree.type)) {
        let prop: PropertyForVariable;
        this.contextVariables.forEach(ctx =>
          ctx.properties.find(pro => {
            if (Utils.compareObject(pro.expressionTree, expressionTree)) {
              prop = pro;
            }
          })
        );
        if (prop) {
          this.selectValues.push(prop.actionNameAndTitle);
        }
      } else if (expressionTree.arguments) {
        this.getLabelFunctionForInitData(expressionTree.arguments, expressionTree, false, 0);
      } else {
        if (this.optionForControl.dataType === 'boolean') {
          const valueString =
            expressionTree.type === SubTypeVariable.NullExp ? 'false' : expressionTree.value.toString();
          this.checkboxCtrl.setValue(<boolean>Utils.convertValue(valueString, 'boolean'));
        } else {
          this.inputCtrl.setValue(expressionTree.value?.toString(), { emitEvent: false });
        }
      }
    }
  }
}
