import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { MatChipList } from '@angular/material/chips';
import { MatMenuTrigger } from '@angular/material/menu';
import {
  ExpressionTree,
  OptionForControl,
  PropertyForVariable,
  SubTypeVariable,
  VariableForAction
} from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { QuillEditorComponent, QuillModules } from 'ngx-quill';
import Quill from 'quill';
import 'quill-mention';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReqValidate } from '../../app-state/app-state.model';
import { Utils } from '../../utils';

@Component({
  selector: 'b3n-value-type-string',
  templateUrl: './value-type-string.component.html',
  styleUrls: ['./value-type-string.component.scss']
})
export class ValueTypeStringComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @ViewChild(MatMenuTrigger, { static: false }) trigger: MatMenuTrigger;
  @ViewChild('chipList') chipList: MatChipList;
  @ViewChild('quill', { static: false }) quill: QuillEditorComponent;
  @Input() optionForControl: OptionForControl;
  @Input() contextVariables: VariableForAction[];
  @Input() reqValidate: ReqValidate;
  @Output() expressionTree = new EventEmitter<{ data: ExpressionTree }>();

  textError: string;
  private _textChanedDebouncer: Subject<string> = new Subject<string>();
  modules: QuillModules = {
    toolbar: false,
    mention: { mentionDenotationChars: [], spaceAfterInsert: false },
    clipboard: { matchVisual: false }
  };

  constructor(private cdr: ChangeDetectorRef) {
    super();
  }

  ngOnInit(): void {
    this._textChanedDebouncer.pipe(takeUntil(this.destroySubscriber$)).subscribe(_ => {
      this.onChangeEditer();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['optionForControl'] && !changes['optionForControl'].firstChange && this.chipList) {
      this.textError = Utils.getErrorExp(this.optionForControl.expressionTree, this.reqValidate);
      this.chipList.errorState = !!this.textError;
    }
  }

  onCreatedQuill(quill: Quill) {
    const expressionTree = this.optionForControl.expressionTree;

    quill.on('text-change', () => {
      this._textChanedDebouncer.next('');
    });

    //initData
    if (!!expressionTree && !expressionTree?.type?.endsWith('null')) {
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
          quill.insertEmbed(0, 'mention', {
            id: JSON.stringify(expressionTree),
            value: prop.actionNameAndTitle,
            denotationChar: ''
          });
        }
      } else if (expressionTree.arguments) {
        this.getLabelFunctionForInitData(quill, expressionTree.arguments, expressionTree, false);
      } else {
        quill.insertText(0, expressionTree?.value?.toString());
      }
    }

    if (this.optionForControl.disabled) {
      this.quill.quillEditor.enable(false);
      this.chipList.setDisabledState(true);
    }
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

  private getLabelFunctionForInitData(
    quill: Quill,
    argumentsFunc: ExpressionTree[] = [],
    itemExpression: ExpressionTree,
    isContext,
    arrayOutsight = [],
    indexLabel: number = 0
  ) {
    const getContext = (expression: ExpressionTree) => {
      const token = expression.type.substring(11, expression.type.length);
      return cloneDeep(this.contextVariables)?.find(ctx => {
        if (ctx.actionName === 'Function') {
          const functionVariable = ctx.functionVariable?.filter(item => item.token === token);
          if (functionVariable && functionVariable?.length) {
            ctx.functionVariable = functionVariable;
            return ctx;
          }
        }
        return null;
      });
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
            this.getLabelFunctionForInitData(quill, item.arguments, item, true, params, indexLabel);
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

      quill.deleteText(indexLabel, 1);
      quill.insertEmbed(indexLabel, 'mention', {
        id: JSON.stringify(itemExpression),
        value: arrayOutsight.length > 1 ? `(${arrayOutsight})` : `${arrayOutsight}`,
        denotationChar: ''
      });
    } else {
      argumentsFunc?.forEach((item, index) => {
        if (this.isContextFormVariable(item.type)) {
          const value = this.getLabelFormContext(item);
          if (value?.length) {
            // magic
            const text = quill.getContents();
            if (text?.ops?.length === 1 && text?.ops[0]?.insert === '\n') {
              quill.insertText(0, ' ');
            }

            quill.insertEmbed(this.getIndex(), 'mention', {
              id: JSON.stringify(item),
              value: value,
              denotationChar: ''
            });
          }
        } else if (item.type.startsWith('function')) {
          const indexLabel = this.getIndex();

          if (item?.arguments?.length) {
            this.getLabelFunctionForInitData(quill, item.arguments, item, false, [], indexLabel);
          } else {
            const context = getContext(item);

            // magic
            const text = quill.getContents();
            if (text?.ops?.length === 1 && text?.ops[0]?.insert === '\n') {
              quill.insertText(0, ' ');
            }

            quill.insertEmbed(indexLabel, 'mention', {
              id: JSON.stringify(item),
              value: `${context.functionVariable[0].name}()`,
              denotationChar: ''
            });
          }
        } else {
          quill.insertText(this.getIndex(), item.value?.toString());
        }
      });
    }
  }

  private getIndex(): number {
    let indexTemp = 0;
    const editers = this.quill.quillEditor.getContents().ops;
    editers?.forEach(op => {
      const insert = op.insert as any;
      if (insert.mention && insert.mention.id) {
        indexTemp += 2;
      } else {
        const value = insert?.slice(0, -1);
        indexTemp += value?.length || 0;
      }
    });
    return indexTemp;
  }

  selectProperty(item: PropertyForVariable) {
    this.trigger.closeMenu();
    this.quill.quillEditor.getModule('mention').insertItem(
      {
        denotationChar: '',
        id: JSON.stringify(item.expressionTree),
        value: item.actionNameAndTitle
      },
      true
    );
  }

  selectFunction(item: ExpressionTree) {
    this.trigger.closeMenu();
    this.quill.quillEditor.getModule('mention').insertItem(
      {
        denotationChar: '',
        id: JSON.stringify(item),
        value: item.label
      },
      true
    );
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

  private emitData(exp: ExpressionTree) {
    if (exp) {
      this.removeLabelFunction(exp.arguments);
    }
    this.textError = Utils.getErrorExp(exp, this.reqValidate);
    this.chipList.errorState = !!this.textError;
    this.expressionTree.emit({ data: exp });
    this.cdr.detectChanges();
  }

  private removeLabelFunction(argumentsFunc: ExpressionTree[] = []) {
    argumentsFunc?.forEach(item => {
      if (item.type.startsWith('function')) {
        this.removeLabelFunction(item.arguments);
        delete item.label;
      }
    });
  }

  private onChangeEditer() {
    const expressionsTemp = [];
    this.quill.quillEditor.getContents().ops.forEach((op, index) => {
      const insert = op.insert as any;
      if (insert.mention && insert.mention.id) {
        const expressions = JSON.parse(insert.mention.id);
        expressionsTemp.push(expressions);
      } else {
        const value: string = insert?.replace(/\u00a0/g, ' ');
        if (value.length && value !== '\n') {
          if (this.quill.quillEditor.getContents().ops[index + 1]) {
            expressionsTemp.push(<ExpressionTree>{
              type: `value - ${this.optionForControl.dataType}`,
              value: value
            });
          } else {
            expressionsTemp.push(<ExpressionTree>{
              type: `value - ${this.optionForControl.dataType}`,
              value: value[value.length - 1] === '\n' ? value?.slice(0, -1) : value
            });
          }
        }
      }
    });

    // remove space first text
    if (expressionsTemp.length && [' ', '\n'].includes(expressionsTemp[0].value)) {
      expressionsTemp.splice(0, 1);
    }

    if (expressionsTemp.length === 0) {
      this.emitData(null);
    } else if (expressionsTemp.length === 1) {
      this.emitData(expressionsTemp[0]);
    } else {
      this.emitData({
        type: SubTypeVariable.StringInterpolationExp,
        arguments: expressionsTemp
      });
    }
  }
}
