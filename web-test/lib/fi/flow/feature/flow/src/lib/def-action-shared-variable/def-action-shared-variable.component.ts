import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import {
  ActionSharedVariable,
  ActionSharedVariableConfig,
  FlowQuery,
  OutputContextVariable,
  SharedVariable,
  SharedVariableService,
  VariableForAction
} from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-def-action-shared-variable',
  templateUrl: './def-action-shared-variable.component.html',
  styleUrls: ['./def-action-shared-variable.component.scss']
})
export class DefActionSharedVariableComponent implements OnInit {
  @Input() contextVariables: VariableForAction[];
  @Input() sharedVariableType:
    | 'SET_SHARED_VARIABLE'
    | 'GET_SHARED_VARIABLE'
    | 'PUSH_SHARED_VARIABLE'
    | 'POP_SHARED_VARIABLE'
    | 'INCREMENT_SHARED_VARIABLE';
  @Input() actionDetail: ActionSharedVariable;
  @Input() disabledEdit: boolean;
  @Output() changeConfigs = new EventEmitter<ActionSharedVariableConfig>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  editable: boolean;
  formConfigs: UntypedFormGroup;
  sharedVariables: SharedVariable[];
  filteredSharedVariables: SharedVariable[];
  flows: SharedVariable[];
  chkboxPushCtrl = new UntypedFormControl();
  chkboxPopCtrl = new UntypedFormControl();
  indexCtrl = new UntypedFormControl();
  customIndexCtrl = new UntypedFormControl(
    null,
    Utils.validateInput({
      required: true,
      dataType: 'number',
      min: ValidateNumberValue.MIN,
      max: ValidateNumberValue.MAX
    })
  );

  get flowUuid(): UntypedFormControl {
    return this.formConfigs.get('flowUuid') as UntypedFormControl;
  }

  get ttl(): UntypedFormControl {
    return this.formConfigs.get('ttl') as UntypedFormControl;
  }
  getErrorTtl() {
    return Utils.getErrorInput(this.ttl);
  }

  get ttlUnit(): UntypedFormControl {
    return this.formConfigs.get('ttlUnit') as UntypedFormControl;
  }

  get index(): UntypedFormControl {
    return this.formConfigs.get('index') as UntypedFormControl;
  }
  getErrorCustomIndex() {
    const textErr = Utils.getErrorInput(this.customIndexCtrl);
    return textErr ? textErr : this.customIndexCtrl.hasError('invalid') ? 'Index is invalid' : '';
  }

  constructor(
    private fb: UntypedFormBuilder,
    private flowQuery: FlowQuery,
    private sharedVariableService: SharedVariableService
  ) {}

  ngOnInit() {
    const flow = this.flowQuery.getValue();
    this.editable = flow.editable && !this.disabledEdit;

    this.sharedVariableService.getSharedVariables().subscribe(res => {
      this.sharedVariables = res;
      if (this.sharedVariableType === 'GET_SHARED_VARIABLE' || this.sharedVariableType === 'POP_SHARED_VARIABLE') {
        this.flows = this.sharedVariables;
        if (!this.flows.find(f => f.flowUuid === flow.uuid)) {
          this.flows.push(<SharedVariable>{
            flowUuid: flow.uuid,
            flowName: flow.name,
            collectionVarNames: [],
            nonCollectionVarNames: []
          });
        }

        this.flowUuid.valueChanges.subscribe(flowUuid => {
          this.filteredSharedVariables = this.sharedVariables.filter(v => v.flowUuid == flowUuid);
        });
      } else {
        this.filteredSharedVariables = this.sharedVariables.filter(v => v.flowUuid == flow.uuid);
      }
    });

    if (this.actionDetail) {
      const config = this.actionDetail.configs;
      switch (this.sharedVariableType) {
        case 'SET_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: [config.flowUuid, Validators.required],
            dynVariableName: [
              config.dynVariableName,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ],
            ttl: config.ttl,
            ttlUnit: config.ttlUnit,
            value: [
              config.value,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ]
          });
          this.ttlUnit.valueChanges.subscribe(type => {
            this.setValidateTTL(type);
          });
          this.setValidateTTL(config.ttlUnit);
          break;
        case 'GET_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: config.flowUuid,
            dynVariableName: [
              config.dynVariableName,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ]
          });
          break;
        case 'PUSH_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: [config.flowUuid, Validators.required],
            dynVariableName: [
              config.dynVariableName,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ],
            ttl: config.ttl,
            ttlUnit: config.ttlUnit,
            mode: config.mode,
            value: [
              config.value,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ]
          });
          this.setValueChangeForTypePush();
          this.setValidateTTL(config.ttlUnit);
          this.chkboxPushCtrl.setValue(config.mode === 'ADD_TO_BACK_NX' ? true : false);
          break;
        case 'POP_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: config.flowUuid,
            dynVariableName: [
              config.dynVariableName,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ],
            mode: config.mode,
            index: [config.index, Validators.required]
          });
          this.setValidateForTypePop();
          if (this.index.value === -1 || this.index.value === 0) {
            this.indexCtrl.setValue(this.index.value);
            this.customIndexCtrl.disable();
          } else {
            this.indexCtrl.setValue(1, { emitEvent: false });
            this.customIndexCtrl.setValue(this.index.value);
          }
          this.chkboxPopCtrl.setValue(config.mode === 'GET_AND_REMOVE' ? true : false);
          break;
        case 'INCREMENT_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: [config.flowUuid, Validators.required],
            dynVariableName: [
              config.dynVariableName,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ],
            ttl: config.ttl,
            ttlUnit: config.ttlUnit
          });
          this.ttlUnit.valueChanges.subscribe(type => {
            this.setValidateTTL(type);
          });
          this.setValidateTTL(config.ttlUnit);
          break;
      }
    } else {
      switch (this.sharedVariableType) {
        case 'SET_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: flow.uuid,
            dynVariableName: [
              null,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ],
            ttl: null,
            ttlUnit: 'MINUTES',
            value: [
              null,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ]
          });
          this.ttlUnit.valueChanges.subscribe(type => {
            this.setValidateTTL(type);
          });
          this.setValidateTTL('MINUTES');
          break;
        case 'GET_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: flow.uuid,
            dynVariableName: [
              null,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ]
          });
          break;
        case 'PUSH_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: flow.uuid,
            dynVariableName: [
              null,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ],
            ttl: null,
            ttlUnit: 'MINUTES',
            mode: 'ADD_TO_BACK',
            value: [
              null,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ]
          });
          this.setValueChangeForTypePush();
          this.setValidateTTL('MINUTES');
          this.chkboxPushCtrl.setValue('ADD_TO_BACK');
          break;
        case 'POP_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: flow.uuid,
            dynVariableName: [
              null,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ],
            mode: 'GET',
            index: [-1, Validators.required]
          });
          this.setValidateForTypePop();
          this.indexCtrl.setValue(-1);
          break;
        case 'INCREMENT_SHARED_VARIABLE':
          this.formConfigs = this.fb.group({
            flowUuid: flow.uuid,
            dynVariableName: [
              null,
              Utils.validateExp({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.USER_INPUT })
            ],
            ttl: null,
            ttlUnit: 'MINUTES'
          });
          this.ttlUnit.valueChanges.subscribe(type => {
            this.setValidateTTL(type);
          });
          this.setValidateTTL('MINUTES');
          break;
      }
    }

    if (!this.editable) {
      this.formConfigs.disable();
      this.chkboxPushCtrl.disable();
      this.chkboxPopCtrl.disable();
      this.indexCtrl.disable({ emitEvent: false });
      this.customIndexCtrl.disable();
    }

    this.formConfigs.valueChanges.subscribe(() => {
      this.emitValue();
    });
    this.formConfigs.updateValueAndValidity({ emitEvent: true });
  }

  getTitleName() {
    switch (this.sharedVariableType) {
      case 'SET_SHARED_VARIABLE':
      case 'GET_SHARED_VARIABLE':
      case 'INCREMENT_SHARED_VARIABLE':
        return 'Key Name';
      case 'PUSH_SHARED_VARIABLE':
      case 'POP_SHARED_VARIABLE':
        return 'List Name';
    }
  }

  private getMaxTTLByType(type: string) {
    switch (type) {
      case 'MINUTES':
        return 129600;
      case 'HOURS':
        return 2160;
      case 'DAYS':
        return 90;
    }
    return 0;
  }

  private setValidateTTL(type: string) {
    this.ttl.setValidators(
      Utils.validateInput({ required: true, dataType: 'number', min: 1, max: this.getMaxTTLByType(type) })
    );
    this.ttl.updateValueAndValidity();
  }

  private setValueChangeForTypePush() {
    this.ttlUnit.valueChanges.subscribe(type => {
      this.setValidateTTL(type);
    });
    this.chkboxPushCtrl.valueChanges.subscribe(val => {
      if (val) {
        this.formConfigs.get('mode').setValue('ADD_TO_BACK_NX');
      } else {
        this.formConfigs.get('mode').setValue('ADD_TO_BACK');
      }
    });
  }

  private setValidateForTypePop() {
    this.chkboxPopCtrl.valueChanges.subscribe(val => {
      if (val) {
        this.formConfigs.get('mode').setValue('GET_AND_REMOVE');
      } else {
        this.formConfigs.get('mode').setValue('GET');
      }
    });

    this.customIndexCtrl.valueChanges.subscribe(val => {
      if (!val) {
        this.index.setValue(this.indexCtrl.value == 1 ? null : this.indexCtrl.value);
      } else {
        if (!Number.isInteger(val)) {
          this.customIndexCtrl.setErrors({ invalid: true }, { emitEvent: false });
          this.index.setValue(null);
        } else {
          this.customIndexCtrl.setErrors({ invalid: null }, { emitEvent: false });
          this.customIndexCtrl.updateValueAndValidity({ emitEvent: false });
          this.index.setValue(val);
        }
      }
    });

    this.indexCtrl.valueChanges.subscribe(val => {
      this.customIndexCtrl.setValue(null);
      if (val == -1 || val == 0) {
        this.index.setValue(val);
        this.customIndexCtrl.disable({ emitEvent: false });
      } else {
        this.index.setValue(null);
        this.customIndexCtrl.enable({ emitEvent: false });
      }
    });
  }

  selectValue(event: OutputContextVariable, key: string) {
    const data = (event as OutputContextVariable)?.data;
    delete data?.label;
    this.formConfigs.get(key).setValue(data);
  }

  private emitValue() {
    if (this.formConfigs.valid) {
      this.changeConfigs.emit(this.formConfigs.value);
    }
    this.invalid.emit(this.formConfigs.invalid);
  }
}
