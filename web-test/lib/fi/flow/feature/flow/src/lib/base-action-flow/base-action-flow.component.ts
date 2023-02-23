import { ChangeDetectorRef, Component } from '@angular/core';
import {
  AbstractControl,
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
  Flow,
  GetDataSourceReq,
  Mapping,
  OptionForControl,
  SubTypeVariable,
  VisibilityDep
} from '@b3networks/api/flow';
import { ReqValidate, Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { forkJoin, Observable } from 'rxjs';

@Component({
  template: ''
})
export class BaseActionFlowComponent extends DestroySubscriberComponent {
  dataSourceUuids: string[] = [];
  showOptionalParam: boolean;
  readonly reqValidate: ReqValidate = {
    maxlength: ValidateStringMaxLength.USER_INPUT,
    min: ValidateNumberValue.MIN,
    max: ValidateNumberValue.MAX
  };

  getErrorField(ctrl: UntypedFormControl | AbstractControl) {
    const textErr = Utils.getErrorInput(ctrl);
    return textErr ? textErr : ctrl.hasError('duplicate') ? 'Field name is already exists' : '';
  }

  constructor(
    protected fb: UntypedFormBuilder,
    protected cdr: ChangeDetectorRef,
    protected dataSourceService: DataSourceService
  ) {
    super();
  }

  isShowOptionalParam(form: UntypedFormGroup) {
    const data = form.getRawValue();
    const urlItem = data.urlMappings?.find(m => m.isOptional && m.visible);
    const headerItem = data.headersMappings?.find(m => m.isOptional && m.visible);
    const bodyItem = data.bodyMappings?.find(m => m.isOptional && m.visible);
    return !!(urlItem || headerItem || bodyItem);
  }

  private addDtsToArr(uuid: string) {
    if (!this.dataSourceUuids.find(dtsUuid => dtsUuid === uuid)) {
      this.dataSourceUuids.push(uuid);
    }
  }

  fetchSelections(flow: Flow) {
    const linkApi: Observable<ConfigStaticDataSource[]>[] = [];
    this.dataSourceUuids.forEach(uuid => {
      const request = <GetDataSourceReq>{
        dataSourceUuid: uuid,
        flowUuid: flow.uuid,
        flowVersion: flow.version
      };
      linkApi.push(this.dataSourceService.fetchSelections(request));
    });
    forkJoin(linkApi).subscribe();
  }

  private createArrayItem(param: BodyParameter, allowEdit: boolean, expTree?: ExpressionTree) {
    if (expTree.type === SubTypeVariable.PlaceholderExp) {
      expTree = null;
    }

    return this.fb.group({
      customRegexValidation: param.customRegexValidation,
      dataType: param.arrayItemDataType,
      disabled: !allowEdit,
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
      visible: true
    });
  }

  createFormGroup(param: BodyParameter, allowEdit: boolean, mapping?: Mapping) {
    const form = this.fb.group({
      customRegexValidation: param.customRegexValidation,
      dataType: param.dataType,
      defaultValueTree: param.defaultValueTree,
      disabled: !allowEdit,
      expressionTree: param.defaultValueTree,
      isOptional: param.visibilityDep ? !param.visibilityDep.requiredWhenShow : param.isOptional,
      key: param.key,
      renderDirective: param.renderDirective,
      title: param.title,
      visibilityDep: param.visibilityDep,
      visible: mapping ? true : param.visibilityDep ? false : true
    });

    if (param.renderDirective?.valueListUuid) {
      this.addDtsToArr(param.renderDirective.valueListUuid);
    }

    const expCtrl = form.get('expressionTree') as UntypedFormControl;
    if (param.dataType === 'array' && !param.renderDirective) {
      form.setControl('arrayItemDataType', new UntypedFormControl(param.arrayItemDataType));
      const formArray = this.fb.array([], !form.value.isOptional && form.value.visible ? Validators.required : null);
      if (param.arrayItemDataType === 'object') {
        const arrFormGroup = new UntypedFormArray([]);
        param.arrItemTemplate.parameters.forEach(subParam => {
          if (!subParam.hidden) {
            if (!mapping) {
              arrFormGroup.push(this.createFormGroup(subParam, allowEdit));
            }
            if (subParam.renderDirective?.valueListUuid) {
              this.addDtsToArr(subParam.renderDirective.valueListUuid);
            }
          }
        });
        form.get('defaultValueTree').setValue(param.arrItemTemplate.parameters);

        if (mapping) {
          mapping.arrayItemsMappings?.forEach(itemMapping => {
            const arrItems: UntypedFormGroup[] = [];
            itemMapping.forEach(item => {
              const subParam = param.arrItemTemplate.parameters.find(p => p.key === item.key);
              if (!subParam.hidden) {
                arrItems.push(this.createFormGroup(subParam, allowEdit, item));
              }
            });
            const arrFormGroup = new UntypedFormArray(arrItems);
            this.updateVisibleParams(arrFormGroup);
            formArray.push(arrFormGroup);
          });
        } else {
          if (!form.value.isOptional && form.value.visible) {
            formArray.push(arrFormGroup);
          }
        }
      } else {
        if (mapping) {
          mapping.expressionTree.arguments?.forEach(exp => {
            formArray.push(this.createArrayItem(param, allowEdit, exp));
          });
        } else {
          if (!form.value.isOptional && form.value.visible) {
            formArray.push(this.createArrayItem(param, allowEdit));
          }
        }
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
      if (mapping) {
        if (mapping.expressionTree.type === SubTypeVariable.PlaceholderExp) {
          mapping = null;
        } else {
          expCtrl.setValue(mapping.expressionTree);
        }
      }
    }

    if (!mapping) {
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

    if (allowEdit) {
      const arrayItemsMappings = form.get('arrayItemsMappings') as UntypedFormArray;
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
                if (param.arrayItemDataType === 'object') {
                  const arrFormGroup = new UntypedFormArray([]);
                  param.arrItemTemplate.parameters.forEach(subParam => {
                    arrFormGroup.push(this.createFormGroup(subParam, allowEdit));
                  });
                  arrayItemsMappings.push(arrFormGroup);
                } else {
                  arrayItemsMappings.push(this.createArrayItem(param, allowEdit));
                }
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
    }
    return form;
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

  updateVisibleParams(formArray: UntypedFormArray) {
    const valuesOfArray = formArray.value as OptionForControl[];
    for (let i = 0; i < valuesOfArray.length; i++) {
      if (valuesOfArray[i].visibilityDep) {
        const thatGroup = formArray.controls[i] as UntypedFormGroup;
        if (this.showParam(valuesOfArray[i].visibilityDep, valuesOfArray)) {
          if (thatGroup.value.visible == false) {
            thatGroup.get('visible').setValue(true);
          }
        } else {
          if (thatGroup.value.visible == true) {
            thatGroup.get('visible').setValue(false);
          }
        }
      }
    }
  }

  getConfigs(form: UntypedFormGroup) {
    const data = cloneDeep(form.value);

    data.urlMappings = data.urlMappings.map(item => {
      return { key: item.key, expressionTree: item.expressionTree };
    });

    data.headersMappings = data.headersMappings.map(item => {
      return { key: item.key, expressionTree: item.expressionTree };
    });

    data.bodyMappings = data.bodyMappings.map(item => {
      if (item.dataType === 'array' && !item.renderDirective) {
        if (item.arrayItemDataType === 'object') {
          item.arrayItemsMappings = item.arrayItemsMappings.map(mappings => {
            return mappings.map(mapping => {
              return { key: mapping.key, expressionTree: mapping.expressionTree };
            });
          });
          return { key: item.key, arrayItemsMappings: item.arrayItemsMappings };
        } else {
          const argumentsTree: ExpressionTree[] = [];
          item.arrayItemsMappings?.forEach(exp => {
            if (exp.expressionTree?.type !== SubTypeVariable.NullExp && exp.expressionTree != null) {
              argumentsTree.push(exp.expressionTree);
            }
          });
          return {
            key: item.key,
            expressionTree: { type: SubTypeVariable.ArrayOfValuesExp, arguments: argumentsTree }
          };
        }
      } else {
        return { key: item.key, expressionTree: item.expressionTree };
      }
    });
    return data;
  }
}
