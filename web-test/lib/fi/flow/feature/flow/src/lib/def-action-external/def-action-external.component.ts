import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import {
  ActionExternal,
  ActionExternalConfig,
  ExpressionTree,
  FlowQuery,
  Mapping,
  OutputContextVariable,
  SubTypeVariable,
  UtilsService,
  VariableForAction
} from '@b3networks/api/flow';
import { Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-def-action-external',
  templateUrl: './def-action-external.component.html',
  styleUrls: ['./def-action-external.component.scss']
})
export class DefActionExternalComponent implements OnInit {
  @Input() contextVariables: VariableForAction[] = [];
  @Input() actionDetail: ActionExternal;
  @Input() disabledEdit: boolean;
  @Output() changeConfigs = new EventEmitter<ActionExternalConfig>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();
  readonly ValidateStringMaxLength = ValidateStringMaxLength;

  editable: boolean;
  formConfigs: UntypedFormGroup;
  formHeaderTemplate: UntypedFormArray;
  urlTemplateInit: ExpressionTree;
  bodyTemplateInit: ExpressionTree;
  extracting: boolean;

  responseCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({
      maxlength: ValidateStringMaxLength.EXTRACT_RESPONSE,
      dataType: 'string',
      required: false
    })
  );

  getErrorCtrl(ctrl: UntypedFormControl) {
    return Utils.getErrorInput(ctrl);
  }

  getErrorResponse() {
    const textErr = Utils.getErrorInput(this.responseCtrl);
    return textErr ? textErr : this.responseCtrl.hasError('invalid') ? 'Response is invalid' : '';
  }

  get urlMappings(): UntypedFormArray {
    return this.formConfigs.get('urlMappings') as UntypedFormArray;
  }
  get headersMappings(): UntypedFormArray {
    return this.formConfigs.get('headersMappings') as UntypedFormArray;
  }
  get bodyMappings(): UntypedFormArray {
    return this.formConfigs.get('bodyMappings') as UntypedFormArray;
  }

  constructor(
    private fb: UntypedFormBuilder,
    private flowQuery: FlowQuery,
    private utilsService: UtilsService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    if (this.actionDetail) {
      const configs = this.actionDetail.configs;
      this.urlTemplateInit = this.createTemplateExp(configs.urlTemplate, configs.urlMappings);
      this.bodyTemplateInit = this.createTemplateExp(configs.bodyTemplate, configs.bodyMappings);
      this.formConfigs = this.fb.group({
        httpVerb: configs.httpVerb,
        maxRetry: configs.maxRetry,
        urlTemplate: [
          null,
          Utils.validateExp({ maxlength: ValidateStringMaxLength.TEMPLATE, dataType: 'string', required: true })
        ],
        urlMappings: this.fb.array([]),
        headerTemplate: '',
        headersMappings: this.fb.array([]),
        bodyTemplate: [
          '',
          Utils.validateInput({
            maxlength: ValidateStringMaxLength.CUSTOM_ACTION_BODY_TEMPLATE,
            dataType: 'string',
            required: false
          })
        ],
        bodyMappings: this.fb.array([]),
        extractedResponseFields: [configs.extractedResponseFields]
      });
      this.formHeaderTemplate = this.fb.array([]);
      this.createHeaderTemplateExp(configs.headerTemplate, configs.headersMappings);
    } else {
      this.formConfigs = this.fb.group({
        httpVerb: 'GET',
        maxRetry: 3,
        urlTemplate: [
          null,
          Utils.validateExp({ maxlength: ValidateStringMaxLength.TEMPLATE, dataType: 'string', required: true })
        ],
        urlMappings: this.fb.array([]),
        headerTemplate: '',
        headersMappings: this.fb.array([]),
        bodyTemplate: [
          '',
          Utils.validateInput({
            maxlength: ValidateStringMaxLength.CUSTOM_ACTION_BODY_TEMPLATE,
            dataType: 'string',
            required: false
          })
        ],
        bodyMappings: this.fb.array([]),
        extractedResponseFields: []
      });
      this.formHeaderTemplate = this.fb.array([]);
    }

    const flow = this.flowQuery.getValue();
    this.editable = flow.editable && !this.disabledEdit;

    if (!this.editable) {
      this.formConfigs.disable();
      this.formHeaderTemplate.disable();
    }

    this.formConfigs.valueChanges.subscribe(() => {
      this.emitValue();
    });
    this.formConfigs.updateValueAndValidity({ emitEvent: true });

    this.formHeaderTemplate.valueChanges.subscribe(() => {
      const str = [];
      this.headersMappings.clear();
      this.formHeaderTemplate.controls.forEach(form => {
        const value = form.value;
        str.push(`${value.key}:${value.value}`);
        const formMappings = <UntypedFormArray>form.get('mappings');
        formMappings.controls.forEach(mapping => {
          this.headersMappings.push(mapping);
        });
      });

      let template = str.join('\n');
      this.headersMappings.controls.forEach((form, index) => {
        form.get('key').setValue(`header.param${index + 1}`);
        template = template.replace('{{header.param}}', `{{header.param${index + 1}}}`);
      });

      this.formConfigs.get('headerTemplate').setValue(template);
    });
  }

  private emitValue() {
    if (this.formConfigs.valid && this.formHeaderTemplate.valid) {
      this.changeConfigs.emit(this.formConfigs.value);
      this.invalid.emit(false);
    } else {
      this.invalid.emit(true);
    }
  }

  addHeaderParam() {
    this.formHeaderTemplate.push(
      this.fb.group({
        key: [
          '',
          Utils.validateInput({
            maxlength: ValidateStringMaxLength.NAME_TITLE,
            dataType: 'string',
            required: true
          })
        ],
        value: [
          null,
          Utils.validateExp({
            maxlength: ValidateStringMaxLength.USER_INPUT,
            dataType: 'string',
            required: true
          })
        ],
        mappings: this.fb.array([]),
        valueInit: ['']
      })
    );
  }

  removeHeaderParam(index: number) {
    this.formHeaderTemplate.removeAt(index);
  }

  private createMapping(exp: ExpressionTree, controlName: string, index?: number): Mapping {
    const prefix = controlName.split('Template')[0];
    return <Mapping>{
      key: `${prefix}.param${index ? index : ''}`,
      expressionTree: exp
    };
  }

  private getMappingFromTemplate(template: string, sourceMappings: Mapping[]): Mapping[] {
    const mappings: Mapping[] = [];
    const regex = new RegExp('{{(.*?)}}', 'gm');
    const childTemplate = template.match(regex);
    if (childTemplate) {
      childTemplate.forEach(str => {
        const mapping = sourceMappings.find(m => `{{${m.key}}}` === str);
        if (mapping) {
          mappings.push(mapping);
        }
      });
    }
    return mappings;
  }

  private createFormArrayMappings(mappings: Mapping[]): UntypedFormArray {
    const formArray = this.fb.array([]);
    mappings.forEach(m => {
      const form = this.fb.group({
        key: m.key,
        expressionTree: m.expressionTree
      });
      formArray.push(form);
    });
    return formArray;
  }

  private createHeaderTemplateExp(template: string, sourceMappings: Mapping[]) {
    if (template) {
      const params: string[] = template.split('\n');
      params?.forEach(item => {
        const values = item.split(':');
        if (values?.length) {
          const mappings = this.getMappingFromTemplate(values[1], sourceMappings);
          this.formHeaderTemplate.push(
            this.fb.group({
              key: [
                values[0],
                Utils.validateInput({
                  maxlength: ValidateStringMaxLength.NAME_TITLE,
                  dataType: 'string',
                  required: true
                })
              ],
              value: [
                '',
                Utils.validateInput({
                  maxlength: ValidateStringMaxLength.USER_INPUT,
                  dataType: 'string',
                  required: true
                })
              ],
              mappings: this.createFormArrayMappings(mappings),
              valueInit: {
                value: this.createTemplateExp(values[1], mappings),
                disabled: true
              }
            })
          );
        }
      });
    }
  }

  private createTemplateExp(template: string, mappings: Mapping[]): ExpressionTree {
    if (mappings.length == 0) {
      return template ? { type: SubTypeVariable.StringExp, value: template } : null;
    } else if (template === `{{${mappings[0].key}}}`) {
      return mappings[0].expressionTree;
    } else {
      const exp: ExpressionTree = { type: SubTypeVariable.StringInterpolationExp, arguments: [] };
      let subTemplate = template;
      mappings.forEach((m, index) => {
        const str = subTemplate.split(`{{${m.key}}}`);
        if (str.length > 1) {
          exp.arguments.push({
            type: SubTypeVariable.StringExp,
            value: str[0]
          });
          exp.arguments.push(m.expressionTree);
          if (index == mappings.length - 1) {
            exp.arguments.push({
              type: SubTypeVariable.StringExp,
              value: str[1]
            });
          } else {
            subTemplate = str[1];
          }
        } else {
          exp.arguments.push({
            type: SubTypeVariable.StringExp,
            value: str[0]
          });
        }
      });
      return exp;
    }
  }

  selectValue(
    event: OutputContextVariable,
    formMapping: UntypedFormArray,
    controlName: string,
    formHeader?: UntypedFormGroup
  ) {
    if (event?.data) {
      switch (event.data.type) {
        case SubTypeVariable.StringExp:
          if (formHeader) {
            formHeader.get('value').setValue(event.data.value);
            const formHeaderMapping = <UntypedFormArray>formHeader.get('mappings');
            formHeaderMapping.clear();
          } else {
            this.formConfigs.get(controlName).setValue(event.data.value);
            formMapping.clear();
          }
          break;
        case SubTypeVariable.StringInterpolationExp: {
          let val = '';
          if (formHeader) {
            const formHeaderMapping = <UntypedFormArray>formHeader.get('mappings');
            formHeaderMapping.clear();
            event.data.arguments.forEach(i => {
              if (i.type === SubTypeVariable.StringExp) {
                val += i.value;
              } else {
                const mapping = this.createMapping(i, controlName);
                formHeaderMapping.push(
                  this.fb.group({
                    key: mapping.key,
                    expressionTree: mapping.expressionTree
                  })
                );
                val += `{{${mapping.key}}}`;
              }
            });
            formHeader.get('value').setValue(val);
          } else {
            formMapping.clear();
            let index = 1;
            event.data.arguments.forEach(i => {
              if (i.type === SubTypeVariable.StringExp) {
                val += i.value;
              } else {
                const mapping = this.createMapping(i, controlName, index);
                formMapping.push(
                  this.fb.group({
                    key: mapping.key,
                    expressionTree: mapping.expressionTree
                  })
                );
                val += `{{${mapping.key}}}`;
                index++;
              }
            });
            this.formConfigs.get(controlName).setValue(val);
          }
          break;
        }
        default:
          if (formHeader) {
            const formHeaderMapping = <UntypedFormArray>formHeader.get('mappings');
            formHeaderMapping.clear();
            const mapping = this.createMapping(event.data, controlName);
            formHeaderMapping.push(
              this.fb.group({
                key: mapping.key,
                expressionTree: mapping.expressionTree
              })
            );
            formHeader.get('value').setValue(`{{${mapping.key}}}`);
          } else {
            formMapping.clear();
            const mapping = this.createMapping(event.data, controlName, 1);
            formMapping.push(
              this.fb.group({
                key: mapping.key,
                expressionTree: mapping.expressionTree
              })
            );
            this.formConfigs.get(controlName).setValue(`{{${mapping.key}}}`);
          }
          break;
      }
    } else {
      if (formHeader) {
        formHeader.get('value').setValue(null);
        const formHeaderMapping = <UntypedFormArray>formHeader.get('mappings');
        formHeaderMapping.clear();
      } else {
        if (controlName === 'bodyTemplate') {
          this.formConfigs.get(controlName).setValue('');
        } else {
          this.formConfigs.get(controlName).setValue(null);
        }
        formMapping.clear();
      }
    }
  }

  extractResponse() {
    if (Utils.checkJson(this.responseCtrl.value)) {
      this.extracting = true;
      this.utilsService
        .extractCustomActionResponse(this.responseCtrl.value)
        .pipe(finalize(() => (this.extracting = false)))
        .subscribe({
          next: data => {
            this.formConfigs.get('extractedResponseFields').setValue(data);
          },
          error: err => {
            this.responseCtrl.setErrors({ invalid: true });
            this.toastService.error(err.message);
          }
        });
    } else {
      this.responseCtrl.setErrors({ invalid: true });
    }
  }

  removeOutput(array: [], index: number) {
    array.splice(index, 1);
  }
}
