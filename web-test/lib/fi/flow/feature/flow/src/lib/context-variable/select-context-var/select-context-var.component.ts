import {
  AfterViewInit,
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
  ConfigStaticDataSource,
  ExpressionTree,
  OptionForControl,
  OutputContextVariable,
  PropertyForVariable,
  SubTypeVariable,
  VariableForAction
} from '@b3networks/api/flow';
import { ReqValidate, Utils } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-select-context-var',
  templateUrl: './select-context-var.component.html',
  styleUrls: ['./select-context-var.component.scss']
})
export class SelectContextVarComponent implements OnInit, OnChanges, AfterViewInit {
  @ViewChild('chipList') chipList: MatChipList;
  @ViewChild('contextVar') contextVar: ElementRef;
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  @Input() optionForControl: OptionForControl;
  @Input() dataSources: ConfigStaticDataSource[];
  @Input() contextVariables: VariableForAction[];
  @Input() keyForContextVar: string;
  @Input() isShowContextVar = true;
  @Input() isShowInputControl = true;
  @Input() typeBooleanCheckbox = true;
  @Input() reqValidate: ReqValidate;
  @Output() expressionTree = new EventEmitter<OutputContextVariable>();
  @Output() property = new EventEmitter<PropertyForVariable>();

  inputCtrl = new UntypedFormControl();
  selectValues: string[] = [];
  widthDropDownMenu: number;
  chipType: 'contextvar' | 'valuelist' = 'contextvar';
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
    if (changes['dataSources']) {
      if (this.dataSources) {
        const expressionTree = this.optionForControl.expressionTree;
        const curValue = this.dataSources.find(d => d.value === expressionTree?.value);
        if (curValue) {
          this.chipType = 'valuelist';
          this.selectValues.length = 0;
          this.selectValues.push(curValue.label);
          const dataType =
            this.optionForControl.dataType === 'array'
              ? this.optionForControl.arrayItemDataType
              : this.optionForControl.dataType;
          const expressionTree = <ExpressionTree>{
            type: `value - ${dataType}`,
            value: Utils.convertValue(curValue.value, dataType)
          };
          this.emitData({
            data: expressionTree,
            dataType: this.optionForControl.dataType
          });
        }
      }
    }
  }

  ngOnInit(): void {
    this.inputCtrl.valueChanges.subscribe(value => {
      if (!value) {
        this.emitData({ data: null });
      } else {
        const dataType =
          this.optionForControl.dataType === 'array'
            ? this.optionForControl.arrayItemDataType
            : this.optionForControl.dataType;
        this.emitData({
          data: <ExpressionTree>{
            type: `value - ${dataType}`,
            value: Utils.convertValue(value, dataType)
          }
        });
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

  ngAfterViewInit(): void {
    this.widthDropDownMenu = this.contextVar?.nativeElement?.offsetWidth - 40;
    this.cdr.detectChanges();
  }

  onOptionSelected(e: ConfigStaticDataSource) {
    this.chipType = 'valuelist';
    this.selectValues.length = 0;
    this.inputCtrl.setValue(null, { emitEvent: false });
    this.selectValues.push(e.label);

    const dataType =
      this.optionForControl.dataType === 'array'
        ? this.optionForControl.arrayItemDataType
        : this.optionForControl.dataType;
    this.emitData({
      data: {
        type: `value - ${dataType}`,
        value: Utils.convertValue(e.value, dataType)
      },
      dataType: this.optionForControl.dataType
    });
  }

  selectProperty(item: PropertyForVariable) {
    this.chipType = 'contextvar';
    this.selectValues.length = 0;
    this.inputCtrl.setValue(null, { emitEvent: false });
    this.selectValues.push(item.actionNameAndTitle);
    this.property.emit(item);
    this.emitData({ data: item.expressionTree, dataType: item.dataType, arrayItemDataType: item.arrayItemDataType });
    this.trigger.closeMenu();
  }

  getRegex() {
    return Utils.getRegex(this.optionForControl.dataType);
  }

  remove(value: string): void {
    const index = this.selectValues.indexOf(value);
    this.selectValues.splice(index, 1);
    this.property.emit(null);
    this.emitData({ data: null, type: '', dataType: '' });
    this.chipType = 'contextvar';
  }

  private getLabelFunctionForInitData(argumentsFunc: ExpressionTree[] = []) {
    argumentsFunc?.forEach(item => {
      if (this.isContextFormVariable(item.type)) {
        const label = this.getLabelFormContext(item);
        if (label?.length) {
          this.selectValues.push(label);
        }
      } else {
        this.selectValues.push(item.value?.toString());
      }
    });
  }

  private getLabelFormContext(expressionTree: ExpressionTree): string {
    const properties = this.contextVariables
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

    return '';
  }

  private isContextFormVariable(type: string) {
    return (
      type === SubTypeVariable.ActionResponseExp ||
      type === SubTypeVariable.ExecutionVarExp ||
      type === SubTypeVariable.ConnectorUserParamsExp ||
      type === SubTypeVariable.TriggerOutputExp ||
      type === SubTypeVariable.FlowStaticVarExp ||
      type === SubTypeVariable.UserPropertiesVarExp ||
      type === SubTypeVariable.GetLoopItemExp
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
            } else {
              pro.arrayItems?.find(item => {
                if (Utils.compareObject(item.expressionTree, expressionTree)) {
                  prop = item;
                }
              });
            }
          })
        );

        if (prop) {
          this.property.emit(prop);
          this.selectValues.push(prop.actionNameAndTitle);
        }
      } else if (expressionTree.arguments) {
        this.getLabelFunctionForInitData(expressionTree.arguments);
      } else {
        if (this.optionForControl.dataType === 'boolean') {
          const valueString =
            expressionTree.type == SubTypeVariable.NullExp ? 'false' : expressionTree.value.toString();
          if (this.typeBooleanCheckbox) {
            this.checkboxCtrl.setValue(<boolean>Utils.convertValue(valueString, 'boolean'));
          } else {
            this.inputCtrl.setValue(valueString.charAt(0).toUpperCase() + valueString.slice(1), {
              emitEvent: false
            });
          }
        } else {
          this.inputCtrl.setValue(expressionTree.value?.toString(), { emitEvent: false });
        }
      }
    }
  }
}
