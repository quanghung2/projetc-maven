import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { S3Service, Status } from '@b3networks/api/file';
import {
  AuthorConnector,
  BodyParameter,
  ConditionVisibilityDep,
  ContentRequest,
  ExtractJsonPropRes,
  Output as PropReqBody,
  RegexValidation,
  RenderDirective,
  RenderDirectiveType,
  UtilsService,
  VisibilityDep
} from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize, startWith } from 'rxjs/operators';

@Component({
  template: ''
})
export class SharedDefComponent extends DestroySubscriberComponent {
  @Input() connectorUuid: string;
  @Output() exit = new EventEmitter<void>();
  @ViewChild('stepper') stepper: MatStepper;

  authorConnector$: Observable<AuthorConnector>;
  extracting: boolean;
  uploading: boolean;
  propertyForm: UntypedFormArray;

  getErrorInput(ctrl: UntypedFormControl | AbstractControl) {
    return Utils.getErrorInput(ctrl);
  }

  constructor(
    protected fb: UntypedFormBuilder,
    protected s3Service: S3Service,
    protected utilsService: UtilsService,
    protected toastService: ToastService
  ) {
    super();
  }

  stepIndexChanged(stepper: MatStepper) {
    stepper.steps.toArray().forEach(step => (step.interacted = false));
  }

  getParamsFromTemplate(template: string): string[] {
    const result: string[] = [];
    const regex = new RegExp('{{(.*?)}}', 'gm');
    const childTemplate = template.match(regex);
    if (childTemplate) {
      childTemplate.forEach(str => {
        result.push(str.replace(/{{/g, '').replace(/}}/g, ''));
      });
    }
    return [...new Set(result)];
  }

  createForm(key: string, isDts: boolean): UntypedFormGroup {
    if (isDts) {
      return this.fb.group({
        key: key,
        title: key,
        // description: '',
        dataType: 'string',
        defaultValueTree: [
          null,
          Utils.validateExp({
            required: true,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.USER_INPUT,
            min: ValidateNumberValue.MIN,
            max: ValidateNumberValue.MAX
          })
        ],
        hidden: true,
        requireUserInput: false
      });
    } else {
      return this.fb.group({
        key: key,
        title: [
          '',
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        description: [
          '',
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ],
        dataType: 'string',
        dataTypeFake: 'string',
        defaultValueTree: null,
        hidden: false,
        requireUserInput: true,
        arrayItemDataType: null,
        arrayItemDataTypeFake: null,
        arrItemUniqueAcrossTriggers: null,
        isOptional: false,
        require: true,
        renderDirective: null,
        visibilityDep: this.createFormVisibilityDep(null),
        customRegexValidation: this.createFormCustomRegexValidation(null)
      });
    }
  }

  createFormToEdit(b: BodyParameter, isDts: boolean): UntypedFormGroup {
    if (isDts) {
      return this.fb.group({
        key: b.key,
        title: b.key,
        // description: b.description,
        dataType: b.dataType,
        defaultValueTree: [
          b.defaultValueTree,
          Utils.validateExp({
            required: true,
            dataType: b.dataType,
            maxlength: ValidateStringMaxLength.USER_INPUT,
            min: ValidateNumberValue.MIN,
            max: ValidateNumberValue.MAX
          })
        ],
        hidden: true,
        requireUserInput: false
      });
    } else {
      const arrItemTemplate = this.fb.group({
        template: '',
        parameters: this.fb.array([])
      });
      if (b.dataType === 'array') {
        const parameters: UntypedFormGroup[] = [];
        if (b['arrItemTemplate'] && b['arrItemTemplate'].parameters?.length) {
          b['arrItemTemplate'].parameters.forEach(item => {
            const form = this.fb.group({
              key: item.key,
              title: [
                item.title,
                Utils.validateInput({
                  required: true,
                  dataType: 'string',
                  maxlength: ValidateStringMaxLength.NAME_TITLE
                })
              ],
              description: [
                item.description,
                Utils.validateInput({
                  required: false,
                  dataType: 'string',
                  maxlength: ValidateStringMaxLength.DESCRIPTION
                })
              ],
              dataType: item.dataType,
              dataTypeFake: [item.renderDirective?.valueListUuid ? item.renderDirective.valueListUuid : item.dataType],
              defaultValueTree: [
                item.dataType === 'boolean' && !item.defaultValueTree
                  ? { type: 'value - boolean', value: false }
                  : item.defaultValueTree
              ],
              hidden: item.hidden,
              requireUserInput: !item.hidden,
              isOptional: item.isOptional,
              require: !item.isOptional,
              renderDirective: this.createFormRenderDirective(item.renderDirective),
              visibilityDep: this.createFormVisibilityDep(item.visibilityDep),
              customRegexValidation: this.createFormCustomRegexValidation(item.customRegexValidation)
            });
            if (item.visibilityDep?.conditions.length > 0) {
              form.get('require').disable();
              form.get('require').setValue(false);
              form.get('isOptional').setValue(true);
            }
            parameters.push(form);
          });

          delete arrItemTemplate.controls['parameters'];
          arrItemTemplate.setControl('parameters', this.fb.array(parameters));
        }

        if (b['arrItemTemplate'] && b['arrItemTemplate'].template?.length) {
          arrItemTemplate.get('template').setValue(b['arrItemTemplate'].template);
        }
      }

      const group = this.fb.group({
        key: b.key,
        title: [
          b.title,
          Utils.validateInput({
            required: true,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.NAME_TITLE
          })
        ],
        description: [
          b.description,
          Utils.validateInput({
            required: false,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.DESCRIPTION
          })
        ],
        dataType: b.dataType,
        dataTypeFake: this.setDataTypeFake(b),
        defaultValueTree: [
          b.dataType === 'boolean' && !b.defaultValueTree
            ? { type: 'value - boolean', value: false }
            : b.defaultValueTree
        ],
        hidden: b.hidden,
        requireUserInput: !b.hidden,
        arrayItemDataType: b?.arrayItemDataType,
        arrayItemDataTypeFake: b.renderDirective ? b.renderDirective.valueListUuid : b.arrayItemDataType,
        arrItemUniqueAcrossTriggers: b.dataType === 'array' ? b.arrItemUniqueAcrossTriggers : null,
        isOptional: b.isOptional,
        require: !b.isOptional,
        renderDirective: this.createFormRenderDirective(b.renderDirective),
        visibilityDep: this.createFormVisibilityDep(b.visibilityDep),
        customRegexValidation: this.createFormCustomRegexValidation(b.customRegexValidation)
      });
      if (b?.arrayItemDataType === 'object') {
        group.setControl('arrItemTemplate', arrItemTemplate);
      }
      if (b.visibilityDep?.conditions.length > 0) {
        group.get('require').disable();
        group.get('require').setValue(false);
        group.get('isOptional').setValue(true);
      }
      return group;
    }
  }

  createFormRequest(isActionDef: boolean): UntypedFormGroup {
    const form = this.fb.group({
      httpVerb: 'GET',
      executionMode: 'INSTANT_RESPONSE',
      maxRetry: 3,
      url: this.fb.group({
        template: [
          '',
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.TEMPLATE })
        ],
        parameters: this.fb.array([])
      }),
      headers: this.fb.group({
        template: '',
        templatesTemp: this.fb.array([
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
              '',
              Utils.validateInput({
                maxlength: ValidateStringMaxLength.NAME_TITLE,
                dataType: 'string',
                required: true
              })
            ]
          })
        ]),
        parameters: this.fb.array([])
      }),
      body: this.fb.group({
        template: [
          '',
          Utils.validateInput({
            required: false,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.CUSTOM_ACTION_BODY_TEMPLATE
          })
        ],
        parameters: this.fb.array([])
      })
    });
    if (isActionDef) {
      form.addControl('postbackTimeout', new UntypedFormControl(''));
    }
    return form;
  }

  createValueOrgToEdit(arrStr: string[]): UntypedFormControl[] {
    const result: UntypedFormControl[] = [];
    arrStr.forEach(str => {
      result.push(
        new UntypedFormControl(
          str,
          Utils.validateInput({
            required: true,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.NAME_TITLE
          })
        )
      );
    });
    return result;
  }

  private createArrayItemProps(p: ExtractJsonPropRes) {
    return this.fb.array([
      this.fb.group({
        path: '$',
        title: [
          '',
          Utils.validateInput({
            required: true,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.NAME_TITLE
          })
        ],
        description: [
          '',
          Utils.validateInput({
            required: false,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.DESCRIPTION
          })
        ],
        dataType: p.arrayItemDataType,
        selectionDataSourceUuid: null
      })
    ]);
  }

  private createFormPrimitive(p: ExtractJsonPropRes) {
    return this.fb.group({
      path: p.path,
      title: [
        '',
        Utils.validateInput({
          required: true,
          dataType: 'string',
          maxlength: ValidateStringMaxLength.NAME_TITLE
        })
      ],
      description: [
        '',
        Utils.validateInput({
          required: false,
          dataType: 'string',
          maxlength: ValidateStringMaxLength.DESCRIPTION
        })
      ],
      dataType: p.dataType,
      selectionDataSourceUuid: null
    });
  }

  private createFormArray(p: ExtractJsonPropRes, arrayItemProps: UntypedFormArray) {
    return this.fb.group({
      path: p.path,
      title: [
        '',
        Utils.validateInput({
          required: true,
          dataType: 'string',
          maxlength: ValidateStringMaxLength.NAME_TITLE
        })
      ],
      description: [
        '',
        Utils.validateInput({
          required: false,
          dataType: 'string',
          maxlength: ValidateStringMaxLength.DESCRIPTION
        })
      ],
      dataType: p.dataType,
      arrayItemDataType: p.arrayItemDataType,
      arrayItemProps: arrayItemProps
    });
  }

  createFormBody(p: ExtractJsonPropRes): UntypedFormGroup {
    let form: UntypedFormGroup;
    if (p.dataType == 'array') {
      if (p.arrayItemDataType == 'object') {
        const arrayItemPropForm = this.fb.array([]);
        p.arrayItemDescriptions.forEach(i => {
          const subForm = this.createFormPrimitive(i);
          if (i.dataType == 'array') {
            subForm.addControl('arrayItemDataType', this.fb.control(i.arrayItemDataType));
            subForm.addControl('arrayItemProps', this.createArrayItemProps(i));
            subForm.removeControl('selectionDataSourceUuid');
          }
          arrayItemPropForm.push(subForm);
        });
        form = this.createFormArray(p, arrayItemPropForm);
      } else {
        form = this.createFormArray(p, this.createArrayItemProps(p));
      }
    } else {
      form = this.createFormPrimitive(p);
    }
    return form;
  }

  private createArrayItemPropsToEdit(p: PropReqBody) {
    return this.fb.array([
      this.fb.group({
        path: '$',
        title: [
          p.arrayItemProps[0].title,
          Utils.validateInput({
            required: true,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.NAME_TITLE
          })
        ],
        description: [
          p.arrayItemProps[0].description,
          Utils.validateInput({
            required: false,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.DESCRIPTION
          })
        ],
        dataType: p.arrayItemProps[0].dataType,
        selectionDataSourceUuid: p.arrayItemProps[0].selectionDataSourceUuid
      })
    ]);
  }

  private createFormPrimitiveToEdit(p: PropReqBody) {
    return this.fb.group({
      path: p.path,
      title: [
        p.title,
        Utils.validateInput({
          required: true,
          dataType: 'string',
          maxlength: ValidateStringMaxLength.NAME_TITLE
        })
      ],
      description: [
        p.description,
        Utils.validateInput({
          required: false,
          dataType: 'string',
          maxlength: ValidateStringMaxLength.DESCRIPTION
        })
      ],
      dataType: p.dataType,
      selectionDataSourceUuid: p.selectionDataSourceUuid
    });
  }

  private createFormArrayToEdit(p: PropReqBody, arrayItemProps: UntypedFormArray) {
    return this.fb.group({
      path: p.path,
      title: [
        p.title,
        Utils.validateInput({
          required: true,
          dataType: 'string',
          maxlength: ValidateStringMaxLength.NAME_TITLE
        })
      ],
      description: [
        p.description,
        Utils.validateInput({
          required: false,
          dataType: 'string',
          maxlength: ValidateStringMaxLength.DESCRIPTION
        })
      ],
      dataType: p.dataType,
      arrayItemDataType: p.arrayItemDataType,
      arrayItemProps: arrayItemProps
    });
  }

  createFormBodyToEdit(p: PropReqBody): UntypedFormGroup {
    let form: UntypedFormGroup;
    if (p.dataType == 'array') {
      if (p.arrayItemDataType == 'object') {
        const arrayItemPropForm = this.fb.array([]);
        p.arrayItemProps.forEach(i => {
          const subForm = this.createFormPrimitiveToEdit(i);
          if (i.dataType == 'array') {
            subForm.addControl('arrayItemDataType', this.fb.control(i.arrayItemDataType));
            subForm.addControl('arrayItemProps', this.createArrayItemPropsToEdit(i));
            subForm.removeControl('selectionDataSourceUuid');
          }
          arrayItemPropForm.push(subForm);
        });
        form = this.createFormArrayToEdit(p, arrayItemPropForm);
      } else {
        form = this.createFormArrayToEdit(p, this.createArrayItemPropsToEdit(p));
      }
    } else {
      form = this.createFormPrimitiveToEdit(p);
    }
    return form;
  }

  private setDataTypeFake(b: BodyParameter) {
    if (b.renderDirective) {
      if (b.renderDirective.type === RenderDirectiveType.File) {
        return 'file';
      }
      if (b.dataType !== 'array') {
        return b.renderDirective.valueListUuid;
      }
    }
    return b.dataType;
  }

  private createFormRenderDirective(rd: RenderDirective): UntypedFormGroup {
    if (rd) {
      return this.fb.group({
        type: rd.type,
        supportedMimeTypes: [rd.supportedMimeTypes],
        valueListUuid: rd.valueListUuid
      });
    }
    return null;
  }

  private createFormConditionVisibilityDep(cvd: ConditionVisibilityDep[]): UntypedFormArray {
    const conditions = this.fb.array([]);
    cvd.forEach(item => {
      conditions.push(
        this.fb.group({
          key: [item.key, Validators.required],
          values: [item.values, Validators.required]
        })
      );
    });
    return conditions;
  }

  private createFormVisibilityDep(vd: VisibilityDep): UntypedFormGroup {
    if (vd) {
      return this.fb.group({
        conditions: this.createFormConditionVisibilityDep(vd.conditions),
        requiredWhenShow: vd.requiredWhenShow
      });
    }
    return this.fb.group({
      conditions: this.fb.array([]),
      requiredWhenShow: false
    });
  }

  private createFormCustomRegexValidation(rv: RegexValidation): UntypedFormGroup {
    let form: UntypedFormGroup;
    if (rv) {
      form = this.fb.group({
        pattern: [
          rv.pattern,
          Utils.validateInput({
            required: false,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.REGEX_PATTERN
          })
        ],
        description: [
          rv.description,
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ]
      });
    } else {
      form = this.fb.group({
        pattern: [
          '',
          Utils.validateInput({
            required: false,
            dataType: 'string',
            maxlength: ValidateStringMaxLength.REGEX_PATTERN
          })
        ],
        description: [
          '',
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ]
      });
    }

    form
      .get('pattern')
      .valueChanges.pipe(startWith(rv?.pattern))
      .subscribe(pattern => {
        if (!pattern) {
          form.get('description').disable();
        } else {
          form.get('description').enable();
        }
      });

    return form;
  }

  transformFromTemplateToParams(template: string): UntypedFormArray {
    let headerParams = this.fb.array([]);

    if (template) {
      const groupsParam: UntypedFormGroup[] = [];
      const params: string[] = template.split('\n');
      params?.forEach(item => {
        const values = item.split(':');
        if (values?.length) {
          groupsParam.push(
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
                values[1],
                Utils.validateInput({
                  maxlength: ValidateStringMaxLength.USER_INPUT,
                  dataType: 'string',
                  required: true
                })
              ]
            })
          );
        }
      });

      if (groupsParam.length) {
        headerParams = this.fb.array(groupsParam);
      }
    }

    return headerParams;
  }

  setHeadersTemplate(control: UntypedFormControl, form: UntypedFormArray) {
    const templatesTemp = form.value;
    const str = [];
    if (templatesTemp?.length) {
      templatesTemp?.forEach(item => {
        if (item.key?.length) {
          str.push(`${item.key}:${item.value}`);
        }
      });
      control.setValue(str.join('\n'));
    }
  }

  onEnterHeaderParam(form) {
    form.push(
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
          '',
          Utils.validateInput({
            maxlength: ValidateStringMaxLength.NAME_TITLE,
            dataType: 'string',
            required: true
          })
        ]
      })
    );
  }

  onRemoveHeaderParam(form, index: number) {
    form.removeAt(index);
  }

  extractJsonProps(ctrl: UntypedFormControl, formResponse: UntypedFormGroup) {
    if (Utils.checkJson(ctrl.value)) {
      this.extracting = true;
      this.utilsService
        .extractJsonProps(ctrl.value)
        .pipe(finalize(() => (this.extracting = false)))
        .subscribe({
          next: data => {
            const oldValue = this.propertyForm.value as PropReqBody[];
            ctrl.setErrors(null);
            const forms = this.fb.array([]);
            data
              .filter(v => v.dataType != 'object')
              .forEach(i => {
                const oldItem = oldValue.find(v => v.path == i.path);
                if (oldItem) {
                  forms.push(this.createFormBodyToEdit(oldItem));
                } else {
                  forms.push(this.createFormBody(i));
                }
              });
            formResponse.setControl('properties', forms);
          },
          error: err => {
            ctrl.setErrors({ invalid: true });
            this.toastService.error(err.message);
          }
        });
    } else {
      ctrl.setErrors({ invalid: true });
    }
  }

  clearParameters(obj: ContentRequest) {
    obj.parameters.forEach(p => {
      // clear visibilityDep
      if (p.visibilityDep?.conditions.length == 0 || p.hidden) {
        p.visibilityDep = null;
      }
      if (p.arrItemTemplate) {
        p.arrItemTemplate.parameters.forEach(x => {
          if (x.visibilityDep?.conditions.length == 0 || x.hidden) {
            x.visibilityDep = null;
          }

          // clear regexPattern
          if (!x.customRegexValidation?.pattern) {
            x.customRegexValidation = null;
          }
        });
      }

      // clear regexPattern
      if (!p.customRegexValidation?.pattern) {
        p.customRegexValidation = null;
      }
    });
  }

  private isValidFileType(file: { name: string; type: string }) {
    const typeAllow = ['jpg', 'jpeg', 'png', 'ico'];
    return file.type.startsWith('image/') && typeAllow.includes(file.type.split('/')[1]);
  }

  onFileChange(event, iconUrl: UntypedFormControl) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (!this.isValidFileType(file)) {
        return;
      }

      this.uploading = true;
      this.s3Service
        .directUploadPublicAsset(file, 'flowicon')
        .pipe(finalize(() => (this.uploading = false)))
        .subscribe({
          next: res => {
            if (res.status === Status.COMPLETED) {
              iconUrl.setValue(res.publicUrl);
            }
          },
          error: err => this.toastService.error(err.message)
        });
    }
  }
}
