import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import {
  AuthenticationType,
  BodyParameter,
  Connector,
  ConnectorConfigBaUser,
  ExpressionTree,
  Mapping
} from '@b3networks/api/flow';
import { ReqValidate, Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { cloneDeep } from 'lodash';
import { combineLatest } from 'rxjs';
import { debounceTime, startWith } from 'rxjs/operators';

@Component({
  selector: 'b3n-connector-config',
  templateUrl: './connector-config.component.html',
  styleUrls: ['./connector-config.component.scss']
})
export class ConnectorConfigComponent implements OnInit {
  @Input() connector: Connector;
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();
  @Output() changeConfigs = new EventEmitter<ConnectorConfigBaUser>();
  AuthenticationType = AuthenticationType;

  formAuth: UntypedFormGroup;
  get value(): UntypedFormControl {
    return this.formAuth.get('value') as UntypedFormControl;
  }
  get token(): UntypedFormControl {
    return this.formAuth.get('token') as UntypedFormControl;
  }
  get userName(): UntypedFormControl {
    return this.formAuth.get('userName') as UntypedFormControl;
  }
  get password(): UntypedFormControl {
    return this.formAuth.get('password') as UntypedFormControl;
  }

  formParams: UntypedFormGroup;
  get mappings(): UntypedFormArray {
    return this.formParams.get('mappings') as UntypedFormArray;
  }

  getError(control: UntypedFormControl) {
    return Utils.getErrorInput(control);
  }

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit() {
    const reqValidate: ReqValidate = {
      dataType: 'string',
      required: true,
      maxlength: ValidateStringMaxLength.USER_INPUT
    };

    // AUTH
    switch (this.connector.authenticationType) {
      case AuthenticationType.API_KEY_QUERY:
      case AuthenticationType.API_KEY_HEADERS:
        this.formAuth = this.fb.group({
          value: [this.connector.authenticationInfo?.value ?? '', Utils.validateInput(reqValidate)]
        });
        break;
      case AuthenticationType.BEARER_TOKEN:
        this.formAuth = this.fb.group({
          token: [this.connector.authenticationInfo?.token ?? '', Utils.validateInput(reqValidate)]
        });
        break;
      case AuthenticationType.BASIC_AUTH:
        this.formAuth = this.fb.group({
          userName: ['', Utils.validateInput(reqValidate)],
          password: ['', Utils.validateInput(reqValidate)],
          value: [this.connector.authenticationInfo?.value ?? '', Utils.validateInput(reqValidate)]
        });
        break;
      default:
        this.formAuth = this.fb.group({});
        break;
    }

    // PARAMS
    const formMapping: UntypedFormGroup[] = [];
    this.connector.userParams?.forEach(p => {
      const mapping = this.connector.userMappings?.mappings?.find(m => m.key == p.key);
      formMapping.push(this.createFormGroup(p, mapping));
    });
    this.formParams = this.fb.group({
      mappings: this.fb.array(formMapping)
    });

    combineLatest([this.formAuth.valueChanges.pipe(startWith({})), this.formParams.valueChanges.pipe(startWith({}))])
      .pipe(debounceTime(200))
      .subscribe(() => {
        this.invalid.emit(this.isInvalid());
        this.changeConfigs.emit({
          authenticationInfo: this.getAuthValue(),
          userMappings: this.getParamsValue()
        });
      });
  }

  private createFormGroup(param: BodyParameter, mapping?: Mapping): UntypedFormGroup {
    return this.fb.group({
      title: param.title,
      key: param.key,
      expressionTreeTemp: [
        mapping?.expressionTree?.value ?? '',
        Utils.validateInput({
          dataType: param.dataType,
          required: true,
          maxlength: ValidateStringMaxLength.USER_INPUT,
          min: ValidateNumberValue.MIN,
          max: ValidateNumberValue.MAX
        })
      ],
      expressionTree: mapping?.expressionTree ?? '',
      dataType: param.dataType
    });
  }

  isInvalid() {
    return this.formAuth.invalid || this.formParams.invalid;
  }

  getAuthValue() {
    const formAuthValue = this.formAuth.value;
    if (this.connector.authenticationType === AuthenticationType.BASIC_AUTH) {
      formAuthValue.value = btoa(`${formAuthValue.userName}:${formAuthValue.password}`);
      delete formAuthValue['userName'];
      delete formAuthValue['password'];
    }
    return formAuthValue;
  }

  getParamsValue() {
    const formParamsValue = cloneDeep(this.formParams.value);
    formParamsValue.mappings = formParamsValue.mappings.map(item => {
      return {
        key: item.key,
        expressionTree: <ExpressionTree>{
          type: `value - ${item.dataType}`,
          value: Utils.convertValue(item.expressionTreeTemp, item.dataType)
        }
      };
    });
    return formParamsValue;
  }
}
