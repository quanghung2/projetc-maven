import { AbstractControl, UntypedFormArray, UntypedFormControl, ValidatorFn } from '@angular/forms';
import { ExpressionTree, SubTypeVariable, VariableForAction } from '@b3networks/api/flow';
import { cloneDeep } from 'lodash';
import { ReqValidate } from './app-state/app-state.model';

export class Utils {
  static getRegex(dataType: string) {
    switch (dataType) {
      case 'string':
        return '[\\s\\S]+';
      case 'number':
        return '^([\\d]*)$';
      default:
        return '';
    }
  }

  static checkJson(str: string) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  static convertValue(value: string, dataType: string) {
    const stringValue = value?.toString();
    try {
      if (dataType === 'number') {
        const data = +stringValue;
        if (isNaN(data)) {
          return '';
        }
        return data;
      }
      if (dataType === 'boolean') {
        if (!stringValue?.trim().length) {
          return false;
        }
        const data = this.getBool(value);
        return data;
      }
      return stringValue;
    } catch (e) {
      return '';
    }
  }

  private static getBool(val: string | boolean) {
    try {
      const vl = val?.toString()?.toLowerCase();
      if (vl === 'true' || vl === 'false') {
        return !!JSON?.parse(String(val).toLowerCase());
      } else {
        return '';
      }
    } catch (e) {
      return '';
    }
  }

  static compareObject(objectFirst: ExpressionTree, objectTwo: ExpressionTree) {
    return JSON.stringify(objectFirst) === JSON.stringify(objectTwo);
  }

  static getDataTypeFromExpression(
    expressionTree: ExpressionTree,
    contextVariables: VariableForAction[] = [],
    getArrayItemDataType: boolean = false
  ) {
    if (expressionTree) {
      if (expressionTree.type.startsWith('function')) {
        if (expressionTree.type === SubTypeVariable.StringInterpolationExp) {
          return 'string';
        }
        if (
          expressionTree.type === SubTypeVariable.ActionResponseExp ||
          expressionTree.type === SubTypeVariable.ExecutionVarExp ||
          expressionTree.type === SubTypeVariable.ConnectorUserParamsExp ||
          expressionTree.type === SubTypeVariable.TriggerOutputExp ||
          expressionTree.type === SubTypeVariable.FlowStaticVarExp ||
          expressionTree.type === SubTypeVariable.UserPropertiesVarExp
        ) {
          const properties = contextVariables
            .map(ctx =>
              ctx.properties.find(pro => {
                if (this.compareObject(pro.expressionTree, expressionTree)) {
                  return pro;
                }
                return null;
              })
            )
            .filter(x => x);
          if (properties.length) {
            if (getArrayItemDataType && properties[0].dataType === 'array') {
              return properties[0].arrayItemDataType;
            }
            return properties[0].dataType;
          }
        } else {
          const token = expressionTree.type.substring(11, expressionTree.type.length);
          const context = cloneDeep(contextVariables).find(ctx => {
            if (ctx.actionName === 'Function') {
              const functionVariable = ctx.functionVariable?.filter(item => item.token === token);
              if (functionVariable && functionVariable?.length) {
                ctx.functionVariable = functionVariable;
                return ctx;
              }
            }
            return null;
          });
          if (context) {
            return context.functionVariable[0].returnType;
          }
        }
      } else {
        const dataType = expressionTree.type.substring(8, expressionTree.type.length);
        return dataType;
      }
    }
    return '';
  }

  static trimText(str: string): string {
    return str.replace(/ /g, '');
  }

  static moveItemInFormArray(formArray: UntypedFormArray, fromIndex: number, toIndex: number): void {
    const dir = toIndex > fromIndex ? 1 : -1;
    const from = fromIndex;
    const to = toIndex;
    const temp = formArray.at(from);
    for (let i = from; i * dir < to * dir; i = i + dir) {
      const current = formArray.at(i + dir);
      formArray.setControl(i, current, { emitEvent: false });
    }
    formArray.setControl(to, temp, { emitEvent: false });
  }

  static validateInput(req: ReqValidate): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      if (req.required && (control.value === '' || control.value === null || control.value === undefined)) {
        return { required: true };
      } else {
        switch (req.dataType) {
          case 'string':
            if (req.minlength && String(control.value).length < req.minlength) {
              return { minlength: true, length: req.minlength };
            } else if (req.maxlength && String(control.value).length > req.maxlength) {
              return { maxlength: true, length: req.maxlength };
            } else if (req.pattern) {
              const re = new RegExp(req.pattern.pattern);
              if (control.value && !re.test(control.value.toString())) {
                return { pattern: true, description: req.pattern.description };
              }
            }
            return null;
          case 'number': {
            const value = Number(control.value);
            if (req.min && value < req.min) {
              return { min: true, value: req.min };
            } else if (req.max && value > req.max) {
              return { max: true, value: req.max };
            } else if (req.pattern) {
              const re = new RegExp(req.pattern.pattern);
              if (control.value && !re.test(control.value.toString())) {
                return { pattern: true, description: req.pattern.description };
              }
            }
            return null;
          }
          default:
            return null;
        }
      }
    };
  }

  static getErrorInput(ctrl: UntypedFormControl | AbstractControl) {
    if (ctrl.hasError('required')) {
      return 'This field is required';
    } else if (ctrl.hasError('minlength')) {
      return `Minimum length is ${ctrl.errors?.['length']} characters`;
    } else if (ctrl.hasError('maxlength')) {
      return `Maximum length is ${ctrl.errors?.['length']} characters`;
    } else if (ctrl.hasError('min')) {
      return `Minimum value is ${ctrl.errors?.['value'].toLocaleString('en')}`;
    } else if (ctrl.hasError('max')) {
      return `Maximum value is ${ctrl.errors?.['value'].toLocaleString('en')} `;
    } else if (ctrl.hasError('pattern')) {
      return ctrl.errors?.['description'];
    } else return '';
  }

  // validate for expression tree
  private static lengthOfValue(curLength: number, expressionTree: ExpressionTree): number {
    if (!expressionTree?.arguments) {
      curLength += expressionTree?.value ? expressionTree.value.toString().length : 0;
    } else {
      expressionTree.arguments.forEach(exp => {
        curLength = this.lengthOfValue(curLength, exp);
      });
    }
    return curLength;
  }

  // set validate when create form control
  static validateExp(req: ReqValidate): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const exp: ExpressionTree = control.value;
      if (req.required && exp == null) {
        return { required: true };
      }

      if (req.pattern) {
        const re = new RegExp(req.pattern.pattern);
        if (exp.value && !re.test(exp.value.toString())) {
          return { pattern: true };
        }
      }

      switch (exp?.type) {
        case SubTypeVariable.NumberExp: {
          const value = Number(exp.value);
          if (req.min && value < req.min) {
            return { min: true };
          } else if (req.max && value > req.max) {
            return { max: true };
          }
          return null;
        }
        default:
          if (req.minlength && this.lengthOfValue(0, exp) < req.minlength) {
            return { minlength: true };
          } else if (req.maxlength && this.lengthOfValue(0, exp) > req.maxlength) {
            return { maxlength: true };
          }
          return null;
      }
    };
  }

  // get validate text
  static getErrorExp(exp: ExpressionTree, req: ReqValidate): string {
    if (req.required && exp == null) {
      const errorText = `This field is required`;
      switch (req.dataType) {
        case 'number':
          return `${errorText} (Note: This field is only accept the number)`;
        case 'boolean':
          return `${errorText} (Note: This field is only accept 'True' or 'False')`;
      }
      return errorText;
    } else {
      if (exp) {
        if (req.pattern) {
          const re = new RegExp(req.pattern.pattern);
          if (exp.value && !re.test(exp.value.toString())) {
            return req.pattern.description;
          }
        }

        switch (exp.type) {
          case SubTypeVariable.NumberExp: {
            const value = Number(exp.value);
            if (req.min && value < req.min) {
              return `Minimum value is ${req.min.toLocaleString('en')}`;
            } else if (req.max && value > req.max) {
              return `Maximum value is ${req.max.toLocaleString('en')} `;
            }
            return '';
          }
          default:
            if (req.minlength && this.lengthOfValue(0, exp) < req.minlength) {
              return `Minimum length is ${req.minlength} characters`;
            } else if (req.maxlength && this.lengthOfValue(0, exp) > req.maxlength) {
              return `Maximum length is ${req.maxlength} characters`;
            }
            return '';
        }
      }
      return '';
    }
  }
}
