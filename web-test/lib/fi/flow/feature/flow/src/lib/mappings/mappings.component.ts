import { AfterContentChecked, ChangeDetectorRef, Component, Input, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatExpansionPanel } from '@angular/material/expansion';
import {
  BodyParameter,
  OptionForControl,
  OutputContextVariable,
  SubTypeVariable,
  VariableForAction,
  VisibilityDep
} from '@b3networks/api/flow';
import { ReqValidate, Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-mappings',
  templateUrl: './mappings.component.html',
  styleUrls: ['./mappings.component.scss']
})
export class MappingsComponent implements AfterContentChecked {
  @Input() isOptional: boolean;
  @Input() formMappings: UntypedFormGroup;
  @Input() contextVariables: VariableForAction[] = [];
  @Input() editable: boolean;
  @Input() isShowContextVar = true;
  @Input() dataSourceUuids: string[] = [];
  @ViewChildren('expandOptionalParam') expandOptionalParam: QueryList<MatExpansionPanel>;

  readonly reqValidate: ReqValidate = {
    maxlength: ValidateStringMaxLength.USER_INPUT,
    min: ValidateNumberValue.MIN,
    max: ValidateNumberValue.MAX
  };

  constructor(private fb: UntypedFormBuilder, private cdr: ChangeDetectorRef) {}

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  showOptionalParam(itemMapping) {
    return itemMapping.value.find(i => i.visible && i.isOptional);
  }

  panelExpand(i: number) {
    return this.expandOptionalParam?.toArray()[i];
  }

  private showParam(visibilityDep: VisibilityDep, formArrayValue: OptionForControl[]) {
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

  addItemForNonObject(arrayItemsMappings: UntypedFormArray, param: BodyParameter) {
    const form = this.fb.group({
      customRegexValidation: param.customRegexValidation,
      dataType: param.arrayItemDataType,
      expressionTree: [
        null,
        Utils.validateExp({
          ...this.reqValidate,
          required: true,
          dataType: param.arrayItemDataType,
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

  addItemForObject(arrayItemMappings: UntypedFormArray, body: BodyParameter[]) {
    const arrItemsMapping = this.fb.array([]);
    if (arrayItemMappings.value && body.length) {
      body.forEach(param => {
        const form = this.fb.group({
          dataType: param.dataType,
          defaultValueTree: param.defaultValueTree,
          expressionTree: param.defaultValueTree,
          isOptional: param.visibilityDep ? !param.visibilityDep.requiredWhenShow : param.isOptional,
          key: param.key,
          title: param.title,
          renderDirective: param.renderDirective,
          visibilityDep: param.visibilityDep,
          visible: param.visibilityDep ? false : true,
          customRegexValidation: param.customRegexValidation
        });

        const expCtrl = form.get('expressionTree') as UntypedFormControl;
        expCtrl.setValidators(
          Utils.validateExp({
            ...this.reqValidate,
            dataType: form.value.dataType,
            required: !form.value.isOptional,
            pattern: form.value.customRegexValidation
          })
        );
        if (form.value.visible) {
          if (form.value.isOptional) {
            expCtrl.setValue(
              form.value.defaultValueTree ? form.value.defaultValueTree : { type: SubTypeVariable.NullExp }
            );
          } else {
            expCtrl.setValue(form.value.defaultValueTree);
          }
        } else {
          expCtrl.setValue({ type: SubTypeVariable.NullExp });
        }

        form.get('visible').valueChanges.subscribe(visible => {
          if (visible) {
            if (form.value.isOptional) {
              expCtrl.setValue(
                form.value.defaultValueTree ? form.value.defaultValueTree : { type: SubTypeVariable.NullExp }
              );
              expCtrl.setValidators(
                Utils.validateExp({
                  ...this.reqValidate,
                  dataType: form.value.dataType,
                  required: false,
                  pattern: form.value.customRegexValidation
                })
              );
            } else {
              expCtrl.setValue(form.value.defaultValueTree);
              expCtrl.setValidators(
                Utils.validateExp({
                  ...this.reqValidate,
                  dataType: form.value.dataType,
                  required: true,
                  pattern: form.value.customRegexValidation
                })
              );
            }
          } else {
            expCtrl.setValue({ type: SubTypeVariable.NullExp });
            expCtrl.setValidators(
              Utils.validateExp({
                ...this.reqValidate,
                dataType: form.value.dataType,
                required: false,
                pattern: form.value.customRegexValidation
              })
            );
          }
          expCtrl.updateValueAndValidity();
        });

        arrItemsMapping.push(form);
      });
      arrayItemMappings.push(arrItemsMapping);
    }
  }

  removeItem(expression: UntypedFormArray, controlIndex: number) {
    expression.removeAt(controlIndex);
  }

  selectValue(event: OutputContextVariable, item: UntypedFormGroup, forms?) {
    const data = (event as OutputContextVariable)?.data;
    delete data?.label;
    if (item.get('isOptional').value && data == null) {
      item.get('expressionTree').setValue({
        type: SubTypeVariable.NullExp
      });
    } else {
      item.get('expressionTree').setValue(data);
    }

    if (forms) {
      const formArray = forms as UntypedFormArray;
      const valuesOfArray = forms.value as OptionForControl[];
      for (let i = 0; i < valuesOfArray.length; i++) {
        if (valuesOfArray[i].visibilityDep) {
          const thatGroup = formArray.controls[i] as UntypedFormGroup;
          if (this.showParam(valuesOfArray[i].visibilityDep, valuesOfArray)) {
            if (thatGroup.get('visible').value == false) {
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
}
