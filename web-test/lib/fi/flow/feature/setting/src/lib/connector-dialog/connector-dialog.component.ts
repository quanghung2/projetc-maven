import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { S3Service, Status } from '@b3networks/api/file';
import {
  AuthenticationType,
  AuthorConnectorQuery,
  AuthorService,
  BodyParameter,
  ConfigAuthorConnectorExternal,
  ConfigAuthorConnectorInternal,
  CreateAuthorConnectorReq
} from '@b3networks/api/flow';
import { Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize, takeUntil } from 'rxjs/operators';
import {
  DefinitionErrorDialogComponent,
  DefinitionErrorDialogInput
} from '../definition-error-dialog/definition-error-dialog.component';

@Component({
  selector: 'b3n-connector-dialog',
  templateUrl: './connector-dialog.component.html',
  styleUrls: ['./connector-dialog.component.scss']
})
export class ConnectorDialogComponent extends DestroySubscriberComponent implements OnInit {
  get type(): UntypedFormControl {
    return this.formConnector.get('type') as UntypedFormControl;
  }
  get iconUrl(): UntypedFormControl {
    return this.formConnector.get('iconUrl') as UntypedFormControl;
  }
  get name(): UntypedFormControl {
    return this.formConnector.get('name') as UntypedFormControl;
  }
  get configs(): UntypedFormControl {
    return this.formConnector.get('configs') as UntypedFormControl;
  }
  get parameters(): UntypedFormArray {
    return this.formConnector.get('userParams.parameters') as UntypedFormArray;
  }
  get licenseSkus(): UntypedFormArray {
    return this.formConnector?.get('licenseSkus') as UntypedFormArray;
  }

  // External
  get baseURL(): UntypedFormControl {
    return this.formConfigExternal.get('baseURL') as UntypedFormControl;
  }

  // globalAuthConfig
  get globalAuthConfig(): UntypedFormGroup {
    return this.formConfigExternal.get('globalAuthConfig') as UntypedFormGroup;
  }
  get authType(): UntypedFormControl {
    return this.globalAuthConfig.get('type') as UntypedFormControl;
  }
  get key(): UntypedFormControl {
    return this.globalAuthConfig.get('key') as UntypedFormControl;
  }

  allowChooseType: boolean;
  readonly orgAllowAddInternal: string[] = [
    '9b311930-2c04-4e49-9c8f-b745807dc64c',
    'fc312420-0047-49a7-94a8-003f11f115c0',
    '9d336117-63e5-412e-96ca-fa5f5627b4ac'
  ];

  formConnector: UntypedFormGroup;
  formConfigInternal: UntypedFormGroup;
  formConfigExternal: UntypedFormGroup;
  AuthenticationType = AuthenticationType;
  suffixVipAddress = '.hoiio.info';
  connectorUuid: string;
  submitting: boolean;
  uploading: boolean;
  isShowDomainVisibility: boolean;
  // Internal
  vipAddressCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
  );

  licenseSkuCtrl = new UntypedFormControl(
    '',
    Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
  );

  getErrorInput(ctrl: UntypedFormControl | AbstractControl) {
    return Utils.getErrorInput(ctrl);
  }

  getErrorLicenseSkuCtrl() {
    const textErr = Utils.getErrorInput(this.licenseSkuCtrl);
    return textErr ? textErr : this.licenseSkuCtrl.hasError('duplicate') ? 'License sku already exists' : '';
  }

  constructor(
    private dialogRef: MatDialogRef<ConnectorDialogComponent>,
    private cdr: ChangeDetectorRef,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    private s3Service: S3Service,
    private authorService: AuthorService,
    private authorConnectorQuery: AuthorConnectorQuery,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    this.authorConnectorQuery
      .select()
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(connector => {
        this.formConfigInternal = this.fb.group({
          vipAddress: ['']
        });

        this.formConfigExternal = this.fb.group({
          baseURL: [
            '',
            Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
          ],
          globalAuthConfig: this.fb.group({
            type: ['', Validators.required],
            key: ['']
          })
        });

        if (connector.uuid) {
          this.isShowDomainVisibility = !!connector.domainVisibility?.published;

          this.connectorUuid = connector.uuid;
          this.allowChooseType = false;
          switch (connector.type) {
            case 'INTERNAL': {
              const configsIn = connector.configs as ConfigAuthorConnectorInternal;
              this.vipAddressCtrl.setValue(configsIn.vipAddress.split(this.suffixVipAddress)[0]);
              this.formConfigInternal = this.fb.group({
                vipAddress: configsIn.vipAddress
              });
              break;
            }
            case 'EXTERNAL': {
              const configsEx = connector.configs as ConfigAuthorConnectorExternal;
              this.formConfigExternal = this.fb.group({
                baseURL: [
                  configsEx.baseURL,
                  Utils.validateInput({
                    required: true,
                    dataType: 'string',
                    maxlength: ValidateStringMaxLength.NAME_TITLE
                  })
                ],
                globalAuthConfig:
                  configsEx.globalAuthConfig.type === AuthenticationType.API_KEY_QUERY ||
                  configsEx.globalAuthConfig.type === AuthenticationType.API_KEY_HEADERS
                    ? this.fb.group({
                        type: [configsEx.globalAuthConfig.type, Validators.required],
                        key: [
                          configsEx.globalAuthConfig.key,
                          Utils.validateInput({
                            required: true,
                            dataType: 'string',
                            maxlength: ValidateStringMaxLength.NAME_TITLE
                          })
                        ]
                      })
                    : this.fb.group({
                        type: [configsEx.globalAuthConfig.type, Validators.required],
                        key: [null]
                      })
              });
              break;
            }
          }

          this.formConnector = this.fb.group({
            type: connector.type,
            name: [
              connector.name,
              Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
            ],
            description: [
              connector.description,
              Utils.validateInput({
                required: false,
                dataType: 'string',
                maxlength: ValidateStringMaxLength.DESCRIPTION
              })
            ],
            iconUrl: connector.iconUrl,
            backgroundColor: connector.backgroundColor,
            configs: connector.type === 'INTERNAL' ? this.formConfigInternal : this.formConfigExternal,
            userParams: this.fb.group({
              parameters: connector.userParams
                ? this.fb.array(this.createForms(connector.userParams.parameters))
                : this.fb.array([])
            }),
            domainVisibility: this.fb.group({
              accessibleUsers: this.fb.array(this.createArrayString(connector.domainVisibility?.accessibleUsers)),
              visibility: connector.domainVisibility?.visibility
            }),
            licenseSkus: this.fb.array(this.createArrayString(connector.licenseSkus))
          });
        } else {
          this.allowChooseType = this.orgAllowAddInternal.find(id => id == X.orgUuid) != null;
          this.isShowDomainVisibility = false;

          this.formConnector = this.fb.group({
            type: this.allowChooseType ? 'INTERNAL' : 'EXTERNAL',
            name: [
              '',
              Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
            ],
            description: [
              '',
              Utils.validateInput({
                required: false,
                dataType: 'string',
                maxlength: ValidateStringMaxLength.DESCRIPTION
              })
            ],
            iconUrl: ['https://ui.b3networks.com/external/icon/icn_connector_default.svg'],
            backgroundColor: ['#ffffff'],
            configs: this.allowChooseType ? this.formConfigInternal : this.formConfigExternal,
            userParams: this.fb.group({
              parameters: this.fb.array([])
            }),
            domainVisibility: null,
            licenseSkus: this.fb.array([])
          });
        }
      });

    this.type.valueChanges.subscribe(type => {
      switch (type) {
        case 'INTERNAL':
          this.formConnector.setControl('configs', this.formConfigInternal);
          break;
        case 'EXTERNAL':
          this.formConnector.setControl('configs', this.formConfigExternal);
          break;
      }
    });

    this.authType.valueChanges.subscribe((type: string) => {
      this.cdr.detectChanges();
      switch (type) {
        case AuthenticationType.NO_AUTH:
        case AuthenticationType.BEARER_TOKEN:
        case AuthenticationType.BASIC_AUTH:
          this.key.setValue(null);
          this.key.setValidators(null);
          break;
        case AuthenticationType.API_KEY_QUERY:
        case AuthenticationType.API_KEY_HEADERS:
          this.key.setValue('');
          this.key.setValidators(
            Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
          );
          break;
      }
    });
  }

  addParam() {
    this.parameters.push(this.initForm());
  }

  removeParam(index: number) {
    this.parameters.removeAt(index);
  }

  addLicenseSku() {
    const newValue = Utils.trimText(this.licenseSkuCtrl.value);
    const value = this.licenseSkus.value.find(i => i == newValue);
    if (!value) {
      this.licenseSkus.push(new UntypedFormControl(newValue));
      this.licenseSkuCtrl.setValue('');
      this.licenseSkuCtrl.setErrors(null);
    } else {
      this.licenseSkuCtrl.setErrors({ duplicate: true });
    }
  }

  removeLicenseSku(index: number) {
    this.licenseSkus.removeAt(index);
  }

  onFileChange(event) {
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
              this.iconUrl.setValue(res.publicUrl);
            }
          },
          error: err => this.toastService.error(err.message)
        });
    }
  }

  disabledSubmit(): boolean {
    switch (this.type.value) {
      case 'INTERNAL':
        return this.vipAddressCtrl.invalid || this.formConnector.invalid;
      case 'EXTERNAL':
        return this.formConfigExternal.invalid || this.formConnector.invalid;
    }
    return false;
  }

  submitConnector() {
    if (this.type.value == 'INTERNAL') {
      if (this.vipAddressCtrl.valid) {
        this.formConnector.get('configs.vipAddress').setValue(`${this.vipAddressCtrl.value}${this.suffixVipAddress}`);
      } else {
        this.formConnector.get('configs.vipAddress').setValue('');
      }
    }

    if (this.formConnector.valid && !this.disabledSubmit()) {
      this.submitting = true;
      const body = <CreateAuthorConnectorReq>this.formConnector.value;

      if (this.connectorUuid) {
        if (!this.isShowDomainVisibility) {
          body.domainVisibility = null;
        }
        this.authorService
          .updateConnector(this.connectorUuid, body)
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe(
            connector => {
              this.toastService.success('Connector has been updated');
              this.dialogRef.close(connector);
            },
            error => {
              if (error.data?.definitions) {
                this.showDialogDefinitionError(<DefinitionErrorDialogInput>{
                  message: error.message,
                  definitions: error.data.definitions
                });
              } else {
                this.toastService.error(error.message);
              }
            }
          );
      } else {
        this.authorService
          .createConnector(body)
          .pipe(finalize(() => (this.submitting = false)))
          .subscribe(
            connector => {
              this.toastService.success('Connector has been created');
              this.dialogRef.close(connector);
            },
            error => {
              if (error.data?.definitions) {
                this.showDialogDefinitionError(<DefinitionErrorDialogInput>{
                  message: error.message,
                  definitions: error.data.definitions
                });
              } else {
                this.toastService.error(error.message);
              }
            }
          );
      }
    }
  }

  private createArrayString(arrStr: string[]): UntypedFormControl[] {
    const result: UntypedFormControl[] = [];
    arrStr.forEach(str => {
      result.push(
        new UntypedFormControl(
          str,
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        )
      );
    });
    return result;
  }

  private showDialogDefinitionError(data: DefinitionErrorDialogInput) {
    this.dialog.open(DefinitionErrorDialogComponent, {
      width: '500px',
      panelClass: 'fif-dialog',
      disableClose: true,
      data: data
    });
  }

  private isValidFileType(file: { name: string; type: string }) {
    const typeAllow = ['jpg', 'jpeg', 'png', 'ico'];
    return file.type.startsWith('image/') && typeAllow.includes(file.type.split('/')[1]);
  }

  private initForm(): UntypedFormGroup {
    const form: UntypedFormGroup = this.fb.group({
      key: [
        '',
        Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
      ],
      title: [
        '',
        Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
      ],
      dataType: ['', Validators.required],
      description: [
        '',
        Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
      ],
      hidden: false
    });
    form.get('title').valueChanges.subscribe((val: string) => {
      const key = val.replace(/@/g, '').replace(/'/g, '');
      form.get('key').setValue(key);
    });
    return form;
  }

  private createForms(body: BodyParameter[]): UntypedFormGroup[] {
    const forms: UntypedFormGroup[] = [];
    body.forEach(p => {
      const form = this.fb.group({
        key: [
          p.key,
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        title: [
          p.title,
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        ],
        dataType: [p.dataType, Validators.required],
        description: [
          p.description,
          Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
        ],
        hidden: p.hidden
      });
      form.get('title').valueChanges.subscribe(val => {
        const key = val.replace(/@/g, '').replace(/'/g, '');
        form.get('key').setValue(key);
      });
      forms.push(form);
    });
    return forms;
  }
}
