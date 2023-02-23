import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { S3Service } from '@b3networks/api/file';
import {
  AuthorDataSource,
  AuthorService,
  BodyParameter,
  ConfigApiDataSource,
  ConfigStaticDataSource,
  CreateAuthorDataSource,
  DataSourceService,
  ExtractJsonPropRes,
  FunctionQuery,
  UtilsService,
  VariableForAction
} from '@b3networks/api/flow';
import { Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { combineLatest } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { SharedDefComponent } from '../shared-def/shared-def.component';

@Component({
  selector: 'b3n-data-source',
  templateUrl: './data-source.component.html',
  styleUrls: ['./data-source.component.scss']
})
export class DataSourceComponent extends SharedDefComponent implements OnInit {
  @Input() connectorType: string;
  @Input() dataSource: AuthorDataSource;

  submitting: boolean;
  contextVariables: VariableForAction[];
  formDataSource: UntypedFormGroup;
  formConfigStatic: UntypedFormArray;
  formConfigApi: UntypedFormGroup;
  selectedName: string;
  arrayPath: ExtractJsonPropRes;
  valueDataTypeCtrl = new UntypedFormControl('string');
  vars: ExtractJsonPropRes[];
  editResponse: boolean;

  get name(): UntypedFormControl {
    return this.formDataSource.get('name') as UntypedFormControl;
  }
  get type(): UntypedFormControl {
    return this.formDataSource.get('type') as UntypedFormControl;
  }
  get config(): UntypedFormGroup {
    return this.formDataSource.get('config') as UntypedFormGroup;
  }

  // request
  get requestUrl(): UntypedFormGroup {
    return this.formConfigApi.get('request.url') as UntypedFormGroup;
  }
  get requestHeaders(): UntypedFormGroup {
    return this.formConfigApi.get('request.headers') as UntypedFormGroup;
  }
  get requestBody(): UntypedFormGroup {
    return this.formConfigApi.get('request.body') as UntypedFormGroup;
  }
  get requestUrlTemplate(): UntypedFormControl {
    return this.requestUrl.get('template') as UntypedFormControl;
  }
  get requestHeadersTemplate(): UntypedFormControl {
    return this.requestHeaders.get('template') as UntypedFormControl;
  }
  get requestBodyTemplate(): UntypedFormControl {
    return this.requestBody.get('template') as UntypedFormControl;
  }

  // response
  get response(): UntypedFormGroup {
    return this.formConfigApi.get('response') as UntypedFormGroup;
  }

  responseCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({
      maxlength: ValidateStringMaxLength.EXTRACT_RESPONSE,
      dataType: 'string',
      required: true
    })
  );
  getErrorResponse() {
    const textErr = Utils.getErrorInput(this.responseCtrl);
    return textErr ? textErr : this.responseCtrl.hasError('invalid') ? 'Response is invalid' : '';
  }

  constructor(
    fb: UntypedFormBuilder,
    s3Service: S3Service,
    utilsService: UtilsService,
    toastService: ToastService,
    private authorService: AuthorService,
    private functionQuery: FunctionQuery,
    private dataSourceService: DataSourceService
  ) {
    super(fb, s3Service, utilsService, toastService);
  }

  ngOnInit(): void {
    combineLatest([this.authorService.getDynamicVarsDataSource(this.connectorUuid), this.functionQuery.selectAll()])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([vars, actions]) => {
        vars.push(
          new VariableForAction({
            actionName: 'Function',
            functionVariable: actions,
            properties: []
          })
        );
        this.contextVariables = vars;
      });

    if (this.dataSource) {
      this.formDataSource = this.fb.group({
        type: this.dataSource.type,
        name: [
          this.dataSource.name,
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        description: [
          this.dataSource.description,
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ],
        config: null
      });

      if (this.dataSource.type == 'STATIC') {
        const formArray = [];
        const config = this.dataSource.config as ConfigStaticDataSource[];
        config.forEach(e => {
          formArray.push(this.initValue(e));
        });
        this.formConfigStatic = new UntypedFormArray(formArray);
        this.valueDataTypeCtrl.setValue(config[0].valueDataType);
      } else {
        const config = this.dataSource.config as ConfigApiDataSource;
        this.formConfigApi = this.fb.group({
          request: this.fb.group({
            httpVerb: config.request.httpVerb,
            executionMode: config.request.executionMode,
            maxRetry: config.request.maxRetry,
            url: this.fb.group({
              template: [
                config.request.url.template,
                Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.TEMPLATE })
              ],
              parameters: this.fb.array([])
            }),
            headers: this.fb.group({
              template: config.request.headers.template,
              templatesTemp: this.transformFromTemplateToParams(config.request.headers.template),
              parameters: this.fb.array([])
            }),
            body: this.fb.group({
              template: [
                config.request.body.template,
                Utils.validateInput({
                  required: false,
                  dataType: 'string',
                  maxlength: ValidateStringMaxLength.CUSTOM_ACTION_BODY_TEMPLATE
                })
              ],
              parameters: this.fb.array([])
            })
          }),
          response: this.fb.group({
            targetArrayPath: [config.response.targetArrayPath, Validators.required],
            valuePath: [config.response.valuePath, Validators.required],
            valueDataType: config.response.valueDataType,
            labelPath: [config.response.labelPath, Validators.required]
          })
        });
      }
    } else {
      this.formDataSource = this.fb.group({
        type: 'STATIC',
        name: [
          '',
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        description: [
          '',
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ],
        config: null
      });
      this.formConfigStatic = new UntypedFormArray([this.initValue()]);
      this.formConfigApi = this.fb.group({
        request: this.createFormRequest(false),
        response: this.fb.group({
          targetArrayPath: ['', Validators.required],
          valuePath: ['', Validators.required],
          valueDataType: '',
          labelPath: ['', Validators.required]
        })
      });
    }

    if (this.formConfigApi) {
      this.response.get('targetArrayPath').valueChanges.subscribe(arrayPath => {
        if (arrayPath && this.vars) {
          this.arrayPath = this.vars.find(v => v.path == arrayPath);
          if (this.arrayPath.arrayItemDataType !== 'object') {
            this.response.patchValue({
              labelPath: '$',
              valuePath: '$',
              valueDataType: this.arrayPath.arrayItemDataType
            });
          }
        }
      });
    }
  }

  private initValue(value?: ConfigStaticDataSource): UntypedFormGroup {
    if (value) {
      return this.fb.group({
        value: [
          value.value,
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        valueDataType: value.valueDataType,
        label: [
          value.label,
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ]
      });
    } else {
      return this.fb.group({
        value: [
          '',
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        valueDataType: 'string',
        label: [
          '',
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ]
      });
    }
  }

  addValue() {
    this.formConfigStatic.push(this.initValue());
  }

  removeValue(index: number) {
    this.formConfigStatic.removeAt(index);
  }

  private setParameters(requestCtrl: UntypedFormControl, requestForm: UntypedFormGroup, key: string) {
    let store: BodyParameter[] = [];
    if (this.dataSource) {
      const config = this.dataSource.config as ConfigApiDataSource;
      store = config.request[key].parameters;
    }

    if (key === 'headers') {
      this.setHeadersTemplate(
        this.requestHeadersTemplate,
        this.requestHeaders.get('templatesTemp') as UntypedFormArray
      );
    }

    const request = this.getParamsFromTemplate(requestCtrl.value);
    const requestForms: UntypedFormGroup[] = [];
    request.forEach(p => {
      const temp = store.find(b => b.key == p);
      if (temp) {
        requestForms.push(this.createFormToEdit(temp, true));
      } else {
        requestForms.push(this.createForm(p, true));
      }
    });
    requestForm.setControl('parameters', this.fb.array(requestForms));
  }

  importRequest() {
    this.setParameters(this.requestUrlTemplate, this.requestUrl, 'url');
    this.setParameters(this.requestHeadersTemplate, this.requestHeaders, 'headers');
    this.setParameters(this.requestBodyTemplate, this.requestBody, 'body');
    this.stepper.next();
  }

  override extractJsonProps() {
    this.arrayPath = null;
    if (Utils.checkJson(this.responseCtrl.value)) {
      this.extracting = true;
      this.utilsService
        .extractJsonProps(this.responseCtrl.value)
        .pipe(finalize(() => (this.extracting = false)))
        .subscribe(
          vars => {
            this.vars = vars.filter(
              v =>
                v.dataType == 'array' &&
                (v.arrayItemDataType == 'string' || v.arrayItemDataType == 'number' || v.arrayItemDataType == 'object')
            );
            this.response.patchValue({
              targetArrayPath: '',
              valuePath: '',
              valueDataType: '',
              labelPath: ''
            });
            this.responseCtrl.setErrors(null);
          },
          error => {
            this.responseCtrl.setErrors({ invalid: true });
            if (this.vars) {
              this.vars.length = 0;
            } else {
              this.vars = [];
            }
            this.toastService.error(error.message);
          }
        );
    } else {
      this.responseCtrl.setErrors({ invalid: true });
    }
  }

  setValueDataType(e: string) {
    const v = this.arrayPath.arrayItemDescriptions.find(v => e == v.path);
    if (v) {
      this.response.get('valueDataType').setValue(v.dataType);
    }
  }

  cancelEdit() {
    this.editResponse = false;
    const config = this.dataSource.config as ConfigApiDataSource;
    this.response.patchValue(
      {
        targetArrayPath: config.response.targetArrayPath,
        valuePath: config.response.valuePath,
        valueDataType: config.response.valueDataType,
        labelPath: config.response.labelPath
      },
      { emitEvent: false }
    );
  }

  disabledSubmit() {
    if (this.type.value == 'STATIC') {
      return this.formDataSource.invalid || this.formConfigStatic.invalid;
    } else {
      return this.formDataSource.invalid || this.formConfigApi.invalid;
    }
  }

  submitDataSource() {
    if (!this.disabledSubmit()) {
      if (this.type.value == 'STATIC') {
        const value = this.formConfigStatic.value;
        value.forEach(e => {
          e.valueDataType = this.valueDataTypeCtrl.value;
        });
        this.config.setValue(value);
      } else {
        const body = this.formConfigApi.getRawValue();
        delete body?.request?.headers['templatesTemp'];
        this.config.setValue(body);
      }

      this.submitting = true;
      if (this.dataSource) {
        this.authorService
          .updateDataSource(this.connectorUuid, this.dataSource.uuid, <CreateAuthorDataSource>this.formDataSource.value)
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe({
            next: () => {
              this.toastService.success('Value has been updated');
              this.exit.emit();
              this.dataSourceService.reset();
            },
            error: err => this.toastService.error(err.message)
          });
      } else {
        this.authorService
          .createDataSource(this.connectorUuid, <CreateAuthorDataSource>this.formDataSource.value)
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe({
            next: () => {
              this.toastService.success('Value has been created');
              this.exit.emit();
            },
            error: err => this.toastService.error(err.message)
          });
      }
    }
  }
}
