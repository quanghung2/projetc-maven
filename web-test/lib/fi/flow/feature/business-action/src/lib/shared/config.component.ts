import { Component, Input } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { BodyParameter, ExpressionTree, SubTypeVariable, VisibilityDep } from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { OptionForInput } from '../input-param/input-param.component';

@Component({
  template: ''
})
export class SharedConfigComponent {
  @Input() isOptional: boolean;
  @Input() formMappings: UntypedFormGroup;

  constructor(private fb: UntypedFormBuilder) {}

  private showParam(visibilityDep: VisibilityDep, formArrayValue: OptionForInput[]) {
    if (visibilityDep) {
      const conditions = visibilityDep.conditions;
      for (let i = 0; i < conditions.length; i++) {
        const formValue = formArrayValue.find(p => p.key === conditions[i].key);
        if (
          !this.showParam(formValue?.visibilityDep, formArrayValue) ||
          !conditions[i].values.includes(formValue?.expressionTree?.value?.toString())
        ) {
          return false;
        }
      }
    }
    return true;
  }

  selectValue(value: ExpressionTree, item: UntypedFormGroup, forms?: UntypedFormArray) {
    if (item.value.isOptional && value == null) {
      item.get('expressionTree').setValue({
        type: SubTypeVariable.NullExp
      });
    } else {
      item.get('expressionTree').setValue(value);
    }

    if (forms) {
      const formArray = forms;
      const valuesOfArray = forms.value as OptionForInput[];
      for (let i = 0; i < valuesOfArray.length; i++) {
        if (valuesOfArray[i].visibilityDep) {
          const thatGroup = formArray.controls[i] as UntypedFormGroup;
          if (this.showParam(valuesOfArray[i].visibilityDep, valuesOfArray)) {
            if (thatGroup.get('visible').value == false && !thatGroup.get('hidden')?.value) {
              thatGroup.get('visible').setValue(true);
            }
          } else {
            if (thatGroup.get('visible').value == true) {
              thatGroup.get('visible').setValue(false);
            }
          }
        }
      }
    }
  }

  addItem(arrayItemsMappings: UntypedFormArray, param: BodyParameter) {
    const form = this.fb.group({
      customRegexValidation: param.customRegexValidation,
      dataType: param.arrayItemDataType,
      expressionTree: [
        null,
        Utils.validateExp({
          required: true,
          dataType: param.arrayItemDataType,
          maxlength: ValidateStringMaxLength.USER_INPUT,
          max: ValidateNumberValue.MAX,
          min: ValidateNumberValue.MIN,
          pattern: param.customRegexValidation
        })
      ],
      isOptional: false,
      key: param.key,
      renderDirective: param.renderDirective,
      title: '',
      visible: true
    });
    arrayItemsMappings.push(form);
  }

  removeItem(arrayItemsMappings: UntypedFormArray, controlIndex: number) {
    arrayItemsMappings.removeAt(controlIndex);
  }
}
