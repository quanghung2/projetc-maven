import { Component } from '@angular/core';
import {
  FormArray,
  FormGroup,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import {
  BodyParameter,
  ConfigStaticDataSource,
  DataSourceService,
  ExpressionTree,
  GetDataSourceReq,
  Mapping,
  SubTypeVariable,
  VisibilityDep
} from '@b3networks/api/flow';
import { ReqValidate, Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { forkJoin, Observable } from 'rxjs';
import { OptionForInput } from '../input-param/input-param.component';

@Component({
  template: ''
})
export class SharedParamComponent {
  readonly reqValidate: ReqValidate = {
    maxlength: ValidateStringMaxLength.USER_INPUT,
    min: ValidateNumberValue.MIN,
    max: ValidateNumberValue.MAX
  };
  showParameters: boolean;
  showOptionalSection: boolean;
  dataSourceUuids: string[] = [];

  constructor(protected fb: UntypedFormBuilder, private dataSourceService: DataSourceService) {}

  addDtsToArr(uuid: string) {
    if (!this.dataSourceUuids.find(dtsUuid => dtsUuid === uuid)) {
      this.dataSourceUuids.push(uuid);
    }
  }

  fetchSelections() {
    const linkApi: Observable<ConfigStaticDataSource[]>[] = [];
    this.dataSourceUuids.forEach(uuid => {
      const request = <GetDataSourceReq>{
        dataSourceUuid: uuid
      };
      linkApi.push(this.dataSourceService.fetchSelections(request));
    });
    forkJoin(linkApi).subscribe();
  }

  createFormGroup(param: BodyParameter, readonly: boolean = false, mapping?: Mapping): UntypedFormGroup {
    if (param.hidden) {
      return this.fb.group({
        key: param.key,
        expressionTree: param.defaultValueTree,
        visible: false,
        hidden: true
      });
    }

    const form = this.fb.group({
      dataType: param.dataType,
      defaultValueTree: param.defaultValueTree ? param.defaultValueTree : null,
      expressionTree: null,
      isOptional: param.visibilityDep ? !param.visibilityDep.requiredWhenShow : param.isOptional,
      key: param.key,
      title: param.title,
      renderDirective: param.renderDirective,
      visibilityDep: param.visibilityDep,
      visible: mapping ? true : param.visibilityDep ? false : true,
      customRegexValidation: param.customRegexValidation,
      readonly: readonly
    });

    const expCtrl = form.get('expressionTree') as UntypedFormControl;
    if (form.value.dataType === 'array') {
      form.setControl('arrayItemDataType', new UntypedFormControl(param.arrayItemDataType));
      const formArray = this.fb.array([], !form.value.isOptional && form.value.visible ? Validators.required : null);
      if (!form.value.isOptional && form.value.visible) {
        formArray.push(this.createArrayItem(param));
      }
      form.setControl('arrayItemsMappings', formArray);
    } else {
      expCtrl.setValidators(
        Utils.validateExp({
          ...this.reqValidate,
          dataType: form.value.dataType,
          required: !form.value.isOptional,
          pattern: form.value.customRegexValidation
        })
      );
    }

    const arrayItemsMappings = form.get('arrayItemsMappings') as UntypedFormArray;
    if (mapping) {
      expCtrl.setValue(mapping.expressionTree);
      if (mapping.expressionTree.arguments) {
        arrayItemsMappings.clear();
        mapping.expressionTree.arguments.forEach(exp => {
          arrayItemsMappings.push(this.createArrayItem(param, readonly, exp));
        });
      }
    } else {
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
    }

    form.get('visible').valueChanges.subscribe(visible => {
      if (visible) {
        if (form.value.isOptional) {
          expCtrl.setValue(
            form.value.defaultValueTree ? form.value.defaultValueTree : { type: SubTypeVariable.NullExp }
          );
          if (form.value.dataType !== 'array') {
            expCtrl.setValidators(
              Utils.validateExp({
                ...this.reqValidate,
                dataType: form.value.dataType,
                required: false,
                pattern: form.value.customRegexValidation
              })
            );
          } else {
            arrayItemsMappings.clear();
            arrayItemsMappings.setValidators(null);
            arrayItemsMappings.updateValueAndValidity();
          }
        } else {
          expCtrl.setValue(form.value.defaultValueTree);
          if (form.value.dataType !== 'array') {
            expCtrl.setValidators(
              Utils.validateExp({
                ...this.reqValidate,
                dataType: form.value.dataType,
                required: true,
                pattern: form.value.customRegexValidation
              })
            );
          } else {
            if (arrayItemsMappings.controls.length == 0) {
              arrayItemsMappings.push(this.createArrayItem(param));
            }
            arrayItemsMappings.setValidators(Validators.required);
            arrayItemsMappings.updateValueAndValidity();
          }
        }
      } else {
        expCtrl.setValue({ type: SubTypeVariable.NullExp });
        if (form.value.dataType !== 'array') {
          expCtrl.setValidators(
            Utils.validateExp({
              ...this.reqValidate,
              dataType: form.value.dataType,
              required: false,
              pattern: form.value.customRegexValidation
            })
          );
        } else {
          arrayItemsMappings.clear();
          arrayItemsMappings.setValidators(null);
          arrayItemsMappings.updateValueAndValidity();
        }
      }
      expCtrl.updateValueAndValidity();
    });
    return form;
  }

  private createArrayItem(param: BodyParameter, readonly: boolean = false, expTree?: ExpressionTree) {
    return this.fb.group({
      customRegexValidation: param.customRegexValidation,
      dataType: param.arrayItemDataType,
      expressionTree: [
        expTree ? expTree : null,
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
      visible: true,
      readonly: readonly
    });
  }

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

  updateParamVisible(formArray: FormArray) {
    const valuesOfArray = formArray.value as OptionForInput[];
    for (let i = 0; i < valuesOfArray.length; i++) {
      if (valuesOfArray[i].visibilityDep) {
        const thatGroup = formArray.controls[i] as FormGroup;
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
