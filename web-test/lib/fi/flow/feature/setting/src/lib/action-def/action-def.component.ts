import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { S3Service } from '@b3networks/api/file';
import {
  ActionType,
  AuthorActionDef,
  AuthorService,
  BodyParameter,
  CreateAuthorActionDef,
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
  selector: 'b3n-action-def',
  templateUrl: './action-def.component.html',
  styleUrls: ['./action-def.component.scss']
})
export class ActionDefComponent extends SharedDefComponent implements OnInit {
  @Input() connectorType: string;
  @Input() actionDef: AuthorActionDef;
  @Input() isShowVisibility: boolean;

  submitting: boolean;
  contextVariables: VariableForAction[];
  formAction: UntypedFormGroup;
  selectedName: string;

  get name(): UntypedFormControl {
    return this.formAction.get('name') as UntypedFormControl;
  }
  get iconUrl(): UntypedFormControl {
    return this.formAction.get('iconUrl') as UntypedFormControl;
  }
  get executionMode(): UntypedFormControl {
    return this.formAction.get('request.executionMode') as UntypedFormControl;
  }
  get postbackTimeout(): UntypedFormControl {
    return this.formAction.get('request.postbackTimeout') as UntypedFormControl;
  }

  // request
  get requestUrl(): UntypedFormGroup {
    return this.formAction.get('request.url') as UntypedFormGroup;
  }
  get requestHeaders(): UntypedFormGroup {
    return this.formAction.get('request.headers') as UntypedFormGroup;
  }
  get requestBody(): UntypedFormGroup {
    return this.formAction.get('request.body') as UntypedFormGroup;
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
    return this.formAction.get('response') as UntypedFormGroup;
  }

  responseCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({
      maxlength: ValidateStringMaxLength.EXTRACT_RESPONSE,
      dataType: 'string',
      required: false
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
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private authorService: AuthorService,
    private functionQuery: FunctionQuery
  ) {
    super(fb, s3Service, utilsService, toastService);
  }

  ngOnInit(): void {
    combineLatest([this.authorService.getDynamicVarsActionDef(this.connectorUuid), this.functionQuery.selectAll()])
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

    if (this.actionDef) {
      if (!this.actionDef.subroutineUuid) {
        const propertyForm = this.fb.array([]);
        this.actionDef.response.properties.forEach(p => {
          propertyForm.push(this.createFormBodyToEdit(p));
        });
        this.propertyForm = cloneDeep(propertyForm);

        this.formAction = this.fb.group({
          iconUrl: this.actionDef.iconUrl,
          name: [
            this.actionDef.name,
            Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
          ],
          description: [
            this.actionDef.description,
            Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
          ],
          type: this.actionDef.type,
          request: this.fb.group({
            httpVerb: this.actionDef.request.httpVerb,
            executionMode: this.actionDef.request.executionMode,
            postbackTimeout: [
              this.actionDef.request.postbackTimeout,
              this.connectorType === 'INTERNAL' && this.actionDef.request.executionMode === 'POSTBACK_RESPONSE'
                ? Utils.validateInput({ required: true, dataType: 'number', min: 1, max: 60 })
                : null
            ],
            maxRetry: this.actionDef.request.maxRetry,
            url: this.fb.group({
              template: [
                this.actionDef.request.url.template,
                Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.TEMPLATE })
              ],
              parameters: this.fb.array([])
            }),
            headers: this.fb.group({
              template: this.actionDef.request.headers.template,
              templatesTemp: this.transformFromTemplateToParams(this.actionDef.request.headers.template),
              parameters: this.fb.array([])
            }),
            body: this.fb.group({
              template: [
                this.actionDef.request.body.template,
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
            properties: propertyForm
          }),
          domainVisibility: this.fb.group({
            visibility: [
              {
                value: this.actionDef.domainVisibility?.visibility,
                disabled: this.actionDef.domainVisibility?.visibilityInherit
              }
            ],
            accessibleUsers: this.fb.array(this.createValueOrgToEdit(this.actionDef.domainVisibility?.accessibleUsers)),
            visibilityInherit: this.actionDef.domainVisibility?.visibilityInherit
          })
        });
      }
    } else {
      this.formAction = this.fb.group({
        iconUrl: null,
        name: [
          '',
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        description: [
          '',
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ],
        type: ActionType.API,
        request: this.createFormRequest(true),
        response: this.fb.group({
          properties: this.fb.array([])
        }),
        domainVisibility: this.fb.group({
          visibility: [{ value: 'PUBLIC', disabled: true }],
          accessibleUsers: this.fb.array([]),
          visibilityInherit: true
        })
      });
    }

    this.executionMode.valueChanges.subscribe(val => {
      if (this.connectorType === 'INTERNAL' && val === 'POSTBACK_RESPONSE') {
        this.postbackTimeout.setValidators(
          Utils.validateInput({ required: true, dataType: 'number', min: 1, max: 60 })
        );
      } else {
        this.postbackTimeout.setValidators(null);
      }
      this.postbackTimeout.updateValueAndValidity();
    });
  }

  private setParameters(requestCtrl: UntypedFormControl, requestForm: UntypedFormGroup, key: string) {
    let store: BodyParameter[] = [];
    if (this.actionDef) {
      store = this.actionDef.request[key].parameters;
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
        requestForms.push(this.createFormToEdit(temp, false));
      } else {
        requestForms.push(this.createForm(p, false));
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
    super.extractJsonProps(this.responseCtrl, this.response);
  }

  submitAction() {
    if (this.formAction.valid) {
      this.submitting = true;
      const body = <CreateAuthorActionDef>this.formAction.getRawValue();
      delete body?.request?.headers['templatesTemp'];
      if (!this.isShowVisibility) {
        body.domainVisibility = null;
      }

      this.clearParameters(body.request.url);
      this.clearParameters(body.request.headers);
      this.clearParameters(body.request.body);

      if (this.actionDef) {
        this.authorService.verifyChangesActionDefs(this.connectorUuid, this.actionDef.uuid, body).subscribe({
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
                    title: 'Update action definition',
                    message: `When edit action definition, a new action definition will be create and currently action definition will be deprecate. Are you sure?`,
                    color: 'warn'
                  }
                })
                .afterClosed()
                .subscribe(confirm => {
                  if (confirm) {
                    this.updateAction(body);
                  } else {
                    this.submitting = false;
                  }
                });
            } else {
              this.updateAction(body);
            }
          },
          error: err => {
            this.submitting = false;
            this.toastService.error(err.message);
          }
        });
      } else {
        this.authorService
          .createAction(this.connectorUuid, body)
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe({
            next: () => {
              this.toastService.success('Action has been created');
              this.exit.emit();
            },
            error: err => this.toastService.error(err.message)
          });
      }
    }
  }

  updateAction(body: CreateAuthorActionDef) {
    this.authorService
      .updateAction(this.connectorUuid, this.actionDef.uuid, body)
      .pipe(finalize(() => (this.submitting = false)))
      .subscribe({
        next: () => {
          this.toastService.success('Action has been updated');
          this.exit.emit();
        },
        error: err => this.toastService.error(err.message)
      });
  }

  editFlow() {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        panelClass: 'fif-dialog',
        data: <ConfirmDialogInput>{
          title: 'Edit action',
          message: `To edit this action, you will need to edit the subroutine that backs it. Do you want to proceed to the subroutine?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.router.navigate(['../flow', this.actionDef.subroutineUuid, this.actionDef.subroutineVersion], {
            relativeTo: this.activatedRoute.parent
          });
        }
      });
  }
}
