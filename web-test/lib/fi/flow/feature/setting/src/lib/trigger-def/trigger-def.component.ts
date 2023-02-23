import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { S3Service } from '@b3networks/api/file';
import {
  AuthorDataSource,
  AuthorService,
  AuthorTriggerDef,
  BodyParameter,
  CreateAuthorTriggerDef,
  FunctionQuery,
  UtilsService,
  VariableForAction
} from '@b3networks/api/flow';
import { Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { combineLatest } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { SharedDefComponent } from '../shared-def/shared-def.component';

@Component({
  selector: 'b3n-trigger-def',
  templateUrl: './trigger-def.component.html',
  styleUrls: ['./trigger-def.component.scss']
})
export class TriggerDefComponent extends SharedDefComponent implements OnInit {
  @Input() triggerDef: AuthorTriggerDef;
  @Input() isShowVisibility: boolean;

  submitting: boolean;
  contextVariables: VariableForAction[];
  formTrigger: UntypedFormGroup;
  selectedName: string;
  dataSources: AuthorDataSource[];

  get name(): UntypedFormControl {
    return this.formTrigger.get('name') as UntypedFormControl;
  }
  get iconUrl(): UntypedFormControl {
    return this.formTrigger.get('iconUrl') as UntypedFormControl;
  }

  // shared
  get sharedInputParameters(): UntypedFormGroup {
    return this.formTrigger.get('sharedInputParameters') as UntypedFormGroup;
  }

  // register
  get registerUrl(): UntypedFormGroup {
    return this.formTrigger.get('registerRequest.url') as UntypedFormGroup;
  }
  get registerHeaders(): UntypedFormGroup {
    return this.formTrigger.get('registerRequest.headers') as UntypedFormGroup;
  }
  get registerBody(): UntypedFormGroup {
    return this.formTrigger.get('registerRequest.body') as UntypedFormGroup;
  }

  get registerUrlTemplate(): UntypedFormControl {
    return this.registerUrl.get('template') as UntypedFormControl;
  }
  get registerHeadersTemplate(): UntypedFormControl {
    return this.registerHeaders.get('template') as UntypedFormControl;
  }
  get registerBodyTemplate(): UntypedFormControl {
    return this.registerBody.get('template') as UntypedFormControl;
  }

  // unregister
  get unregisterUrl(): UntypedFormGroup {
    return this.formTrigger.get('unregisterRequest.url') as UntypedFormGroup;
  }
  get unregisterHeaders(): UntypedFormGroup {
    return this.formTrigger.get('unregisterRequest.headers') as UntypedFormGroup;
  }
  get unregisterBody(): UntypedFormGroup {
    return this.formTrigger.get('unregisterRequest.body') as UntypedFormGroup;
  }

  get unregisterUrlTemplate(): UntypedFormControl {
    return this.unregisterUrl.get('template') as UntypedFormControl;
  }
  get unregisterHeadersTemplate(): UntypedFormControl {
    return this.unregisterHeaders.get('template') as UntypedFormControl;
  }
  get unregisterBodyTemplate(): UntypedFormControl {
    return this.unregisterBody.get('template') as UntypedFormControl;
  }

  // triggerRequestBody
  get triggerRequestBody(): UntypedFormGroup {
    return this.formTrigger.get('triggerRequestBody') as UntypedFormGroup;
  }

  triggerRequestBodyCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({
      maxlength: ValidateStringMaxLength.EXTRACT_RESPONSE,
      dataType: 'string',
      required: false
    })
  );
  getErrorTriggerRequestBody() {
    const textErr = Utils.getErrorInput(this.triggerRequestBodyCtrl);
    return textErr ? textErr : this.triggerRequestBodyCtrl.hasError('invalid') ? 'Event Request Body is invalid' : '';
  }

  get isNotParameter(): boolean {
    return (
      !this.sharedInputParameters.get('url')['controls'].length &&
      !this.sharedInputParameters.get('headers')['controls'].length &&
      !this.sharedInputParameters.get('body')['controls'].length &&
      !this.registerUrl.get('parameters')['controls'].length &&
      !this.registerHeaders.get('parameters')['controls'].length &&
      !this.registerBody.get('parameters')['controls'].length &&
      !this.unregisterUrl.get('parameters')['controls'].length &&
      !this.unregisterHeaders.get('parameters')['controls'].length &&
      !this.unregisterBody.get('parameters')['controls'].length
    );
  }

  constructor(
    fb: UntypedFormBuilder,
    s3Service: S3Service,
    utilsService: UtilsService,
    toastService: ToastService,
    private dialog: MatDialog,
    private authorService: AuthorService,
    private functionQuery: FunctionQuery
  ) {
    super(fb, s3Service, utilsService, toastService);
  }

  ngOnInit(): void {
    combineLatest([this.authorService.getDynamicVarsTriggerDef(this.connectorUuid), this.functionQuery.selectAll()])
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

    if (this.triggerDef) {
      const propertyForm = this.fb.array([]);
      this.triggerDef.triggerRequestBody.properties.forEach(p => {
        propertyForm.push(this.createFormBodyToEdit(p));
      });
      this.propertyForm = cloneDeep(propertyForm);

      this.formTrigger = this.fb.group({
        iconUrl: this.triggerDef.iconUrl,
        name: [
          this.triggerDef.name,
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        description: [
          this.triggerDef.description,
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ],
        sharedInputParameters: this.fb.group({
          url: this.fb.array([]),
          headers: this.fb.array([]),
          body: this.fb.array([])
        }),
        registerRequest: this.fb.group({
          httpVerb: this.triggerDef.registerRequest.httpVerb,
          executionMode: this.triggerDef.registerRequest.executionMode,
          maxRetry: this.triggerDef.registerRequest.maxRetry,
          url: this.fb.group({
            template: [
              this.triggerDef.registerRequest.url.template,
              Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.TEMPLATE })
            ],
            parameters: this.fb.array([])
          }),
          headers: this.fb.group({
            template: this.triggerDef.registerRequest.headers.template,
            templatesTemp: this.transformFromTemplateToParams(this.triggerDef.registerRequest.headers.template),
            parameters: this.fb.array([])
          }),
          body: this.fb.group({
            template: [
              this.triggerDef.registerRequest.body.template,
              Utils.validateInput({
                required: false,
                dataType: 'string',
                maxlength: ValidateStringMaxLength.CUSTOM_ACTION_BODY_TEMPLATE
              })
            ],
            parameters: this.fb.array([])
          })
        }),
        unregisterRequest: this.fb.group({
          httpVerb: this.triggerDef.unregisterRequest.httpVerb,
          executionMode: this.triggerDef.unregisterRequest.executionMode,
          maxRetry: this.triggerDef.unregisterRequest.maxRetry,
          url: this.fb.group({
            template: [
              this.triggerDef.unregisterRequest.url.template,
              Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.TEMPLATE })
            ],
            parameters: this.fb.array([])
          }),
          headers: this.fb.group({
            template: this.triggerDef.unregisterRequest.headers.template,
            templatesTemp: this.transformFromTemplateToParams(this.triggerDef.unregisterRequest.headers.template),
            parameters: this.fb.array([])
          }),
          body: this.fb.group({
            template: [
              this.triggerDef.unregisterRequest.body.template,
              Utils.validateInput({
                required: false,
                dataType: 'string',
                maxlength: ValidateStringMaxLength.CUSTOM_ACTION_BODY_TEMPLATE
              })
            ],
            parameters: this.fb.array([])
          })
        }),
        triggerRequestBody: this.fb.group({
          properties: propertyForm
        }),
        registerConfig: this.fb.group({
          multipleRegistrationAllowed: this.triggerDef.registerConfig.multipleRegistrationAllowed,
          reRegisterAllowed: this.triggerDef.registerConfig.reRegisterAllowed
        }),
        domainVisibility: this.fb.group({
          visibility: [
            {
              value: this.triggerDef.domainVisibility?.visibility,
              disabled: this.triggerDef.domainVisibility?.visibilityInherit
            }
          ],
          accessibleUsers: this.fb.array(this.createValueOrgToEdit(this.triggerDef.domainVisibility?.accessibleUsers)),
          visibilityInherit: this.triggerDef.domainVisibility?.visibilityInherit
        })
      });
    } else {
      this.formTrigger = this.fb.group({
        iconUrl: null,
        name: [
          '',
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        description: [
          '',
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ],
        sharedInputParameters: this.fb.group({
          url: this.fb.array([]),
          headers: this.fb.array([]),
          body: this.fb.array([])
        }),
        registerRequest: this.createFormRequest(false),
        unregisterRequest: this.createFormRequest(false),
        triggerRequestBody: this.fb.group({
          properties: this.fb.array([])
        }),
        registerConfig: this.fb.group({
          multipleRegistrationAllowed: true,
          reRegisterAllowed: false
        }),
        domainVisibility: this.fb.group({
          visibility: [{ value: 'PUBLIC', disabled: true }],
          accessibleUsers: this.fb.array([]),
          visibilityInherit: true
        })
      });
    }
  }

  private setParameters(
    registerCtrl: UntypedFormControl,
    registerForm: UntypedFormGroup,
    unregisterCtrl: UntypedFormControl,
    unregisterForm: UntypedFormGroup,
    key: string
  ) {
    let store: BodyParameter[] = [];
    if (this.triggerDef) {
      store = [
        ...new Set([
          ...this.triggerDef.registerRequest[key].parameters,
          ...this.triggerDef.unregisterRequest[key].parameters
        ])
      ];
    }

    if (key === 'headers') {
      this.setHeadersTemplate(
        this.registerHeadersTemplate,
        this.registerHeaders.get('templatesTemp') as UntypedFormArray
      );
      this.setHeadersTemplate(
        this.unregisterHeadersTemplate,
        this.unregisterHeaders.get('templatesTemp') as UntypedFormArray
      );
    }

    const register = this.getParamsFromTemplate(registerCtrl.value);
    const unregister = this.getParamsFromTemplate(unregisterCtrl.value);
    const shared = register.filter(p => unregister.includes(p));

    // shared
    const sharedForms: UntypedFormGroup[] = [];
    shared.forEach(p => {
      const temp = store.find(b => b.key == p);
      if (temp) {
        sharedForms.push(this.createFormToEdit(temp, false));
      } else {
        sharedForms.push(this.createForm(p, false));
      }
    });
    this.sharedInputParameters.setControl(key, this.fb.array(sharedForms));

    // register
    const registerForms: UntypedFormGroup[] = [];
    register.forEach(p => {
      if (!shared.includes(p)) {
        const temp = store.find(b => b.key == p);
        if (temp) {
          registerForms.push(this.createFormToEdit(temp, false));
        } else {
          registerForms.push(this.createForm(p, false));
        }
      }
    });
    registerForm.setControl('parameters', this.fb.array(registerForms));

    // unregister
    const unregisterForms: UntypedFormGroup[] = [];
    unregister.forEach(p => {
      if (!shared.includes(p)) {
        const temp = store.find(b => b.key == p);
        if (temp) {
          unregisterForms.push(this.createFormToEdit(temp, false));
        } else {
          unregisterForms.push(this.createForm(p, false));
        }
      }
    });
    unregisterForm.setControl('parameters', this.fb.array(unregisterForms));
  }

  importRequest() {
    this.setParameters(
      this.registerUrlTemplate,
      this.registerUrl,
      this.unregisterUrlTemplate,
      this.unregisterUrl,
      'url'
    );

    this.setParameters(
      this.registerHeadersTemplate,
      this.registerHeaders,
      this.unregisterHeadersTemplate,
      this.unregisterHeaders,
      'headers'
    );

    this.setParameters(
      this.registerBodyTemplate,
      this.registerBody,
      this.unregisterBodyTemplate,
      this.unregisterBody,
      'body'
    );

    this.stepper.next();
  }

  override extractJsonProps() {
    super.extractJsonProps(this.triggerRequestBodyCtrl, this.triggerRequestBody);
  }

  submitTrigger() {
    if (this.formTrigger.valid) {
      this.submitting = true;
      const body: CreateAuthorTriggerDef = <CreateAuthorTriggerDef>this.getAuthorTriggerDef();
      if (!this.isShowVisibility) {
        body.domainVisibility = null;
      }

      this.clearParameters(body.registerRequest.url);
      this.clearParameters(body.registerRequest.headers);
      this.clearParameters(body.registerRequest.body);
      this.clearParameters(body.unregisterRequest.url);
      this.clearParameters(body.unregisterRequest.headers);
      this.clearParameters(body.unregisterRequest.body);

      if (this.triggerDef) {
        this.authorService.verifyChangesTriggerDefs(this.connectorUuid, this.triggerDef.uuid, body).subscribe({
          next: res => {
            if (
              res.urlChanges?.length ||
              res.headersChanges?.length ||
              res.bodyChanges?.length ||
              res.outputChanges?.length
            ) {
              this.dialog
                .open(ConfirmDialogComponent, {
                  width: '500px',
                  panelClass: 'fif-dialog',
                  disableClose: true,
                  data: <ConfirmDialogInput>{
                    title: 'Update event definition',
                    message: `When edit event definition, a new event definition will be create and currently event definition will be deprecate. Are you sure?`,
                    color: 'warn'
                  }
                })
                .afterClosed()
                .subscribe(confirm => {
                  if (confirm) {
                    this.updateTrigger(body);
                  } else {
                    this.submitting = false;
                  }
                });
            } else {
              this.updateTrigger(body);
            }
          },
          error: err => {
            this.submitting = false;
            this.toastService.error(err.message);
          }
        });
      } else {
        this.authorService
          .createTrigger(this.connectorUuid, body)
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe({
            next: () => {
              this.toastService.success('Event has been created');
              this.exit.emit();
            },
            error: err => this.toastService.error(err.message)
          });
      }
    }
  }

  updateTrigger(body: CreateAuthorTriggerDef) {
    this.authorService
      .updateTrigger(this.connectorUuid, this.triggerDef.uuid, body)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastService.success('Event has been updated');
          this.exit.emit();
        },
        error: err => this.toastService.error(err.message)
      });
  }

  private getAuthorTriggerDef(): CreateAuthorTriggerDef {
    const body = <CreateAuthorTriggerDef>this.formTrigger.getRawValue();
    delete body?.registerRequest?.headers['templatesTemp'];
    delete body?.unregisterRequest?.headers['templatesTemp'];

    // merge sharedInputParameter to registerRequest and unregisterRequest
    if (body.sharedInputParameters.body?.length) {
      body.registerRequest.body.parameters = [
        ...body.registerRequest.body.parameters,
        ...body.sharedInputParameters.body
      ];
      body.unregisterRequest.body.parameters = [
        ...body.unregisterRequest.body.parameters,
        ...body.sharedInputParameters.body
      ];
    }
    if (body.sharedInputParameters.headers?.length) {
      body.registerRequest.headers.parameters = [
        ...body.registerRequest.headers.parameters,
        ...body.sharedInputParameters.headers
      ];
      body.unregisterRequest.headers.parameters = [
        ...body.unregisterRequest.headers.parameters,
        ...body.sharedInputParameters.headers
      ];
    }
    if (body.sharedInputParameters.url?.length) {
      body.registerRequest.url.parameters = [...body.registerRequest.url.parameters, ...body.sharedInputParameters.url];
      body.unregisterRequest.url.parameters = [
        ...body.unregisterRequest.url.parameters,
        ...body.sharedInputParameters.url
      ];
    }

    delete body?.sharedInputParameters;

    return body;
  }
}
