import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ActionDefineConstant, ActionDefineConstantConfig, DefineConstant, FlowQuery } from '@b3networks/api/flow';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-def-action-define-constant',
  templateUrl: './def-action-define-constant.component.html',
  styleUrls: ['./def-action-define-constant.component.scss']
})
export class DefActionDefineConstantComponent implements OnInit {
  @Input() actionDetail: ActionDefineConstant;
  @Input() disabledEdit: boolean;
  @Output() changeConfigs = new EventEmitter<ActionDefineConstantConfig>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  editable: boolean;
  formConfigs: UntypedFormGroup;

  getErrorTitle(ctrl: UntypedFormControl) {
    const textErr = Utils.getErrorInput(ctrl);
    return textErr ? textErr : ctrl.hasError('duplicate') ? 'Parameter name is already exists' : '';
  }

  getErrorValue(ctrl: UntypedFormControl) {
    return Utils.getErrorInput(ctrl);
  }

  get constants(): UntypedFormArray {
    return this.formConfigs.get('constants') as UntypedFormArray;
  }

  constructor(private fb: UntypedFormBuilder, private flowQuery: FlowQuery) {}

  ngOnInit(): void {
    const flow = this.flowQuery.getValue();
    this.editable = flow.editable && !this.disabledEdit;

    this.formConfigs = this.fb.group({
      constants: this.fb.array([], Validators.required)
    });

    if (this.actionDetail) {
      this.actionDetail.configs.constants.forEach(i => this.add(i));
    } else {
      this.add();
    }

    if (!this.editable) {
      this.formConfigs.disable({ emitEvent: false });
    }

    this.formConfigs.valueChanges.subscribe(() => {
      this.emitValue();
    });
    this.formConfigs.updateValueAndValidity({ emitEvent: true });
  }

  add(item?: DefineConstant) {
    let form;
    if (item) {
      form = this.fb.group({
        title: [
          item.title,
          Utils.validateInput({
            maxlength: ValidateStringMaxLength.NAME_TITLE,
            dataType: 'string',
            required: true
          })
        ],
        description: item.description,
        dataType: [item.dataType, Validators.required],
        value: this.fb.group({
          type: [item.value.type, Validators.required],
          value: [
            item.value.value,
            Utils.validateInput({
              maxlength: ValidateStringMaxLength.USER_INPUT,
              dataType: item.dataType,
              required: true
            })
          ]
        })
      });
    } else {
      form = this.fb.group({
        title: [
          '',
          Utils.validateInput({
            maxlength: ValidateStringMaxLength.NAME_TITLE,
            dataType: 'string',
            required: true
          })
        ],
        description: '',
        dataType: ['', Validators.required],
        value: this.fb.group({
          type: ['', Validators.required],
          value: [
            null,
            Utils.validateInput({
              maxlength: ValidateStringMaxLength.USER_INPUT,
              dataType: '',
              required: true
            })
          ]
        })
      });
    }

    form.get('title').valueChanges.subscribe(title => {
      if (this.constants.value.filter(i => i.title === title).length > 0) {
        form.get('title').setErrors({ duplicate: true });
      } else {
        form.get('title').setErrors({ duplicate: null });
        form.get('title').updateValueAndValidity({ emitEvent: false });
      }
    });
    form.get('dataType').valueChanges.subscribe(type => {
      form.get('value.type').setValue(`value - ${type}`);
      form.get('value.value').setValue(null, { emitEvent: false });
      form.get('value.value').setValidators(
        Utils.validateInput({
          maxlength: ValidateStringMaxLength.USER_INPUT,
          min: ValidateNumberValue.MIN,
          max: ValidateNumberValue.MAX,
          dataType: type,
          required: true
        })
      );
      form.get('value.value').updateValueAndValidity({ emitEvent: false });
    });
    form.get('value.value').valueChanges.subscribe(value => {
      if (form.get('dataType').value === 'number') {
        form.get('value.value').setValue(Utils.convertValue(value, 'number'), { emitEvent: false });
      }
    });
    this.constants.push(form);
  }

  remove(index: number) {
    this.constants.removeAt(index);
  }

  private emitValue() {
    if (this.formConfigs.valid) {
      this.changeConfigs.emit(this.formConfigs.value);
    }
    this.invalid.emit(this.formConfigs.invalid);
  }
}
