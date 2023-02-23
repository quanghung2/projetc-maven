import { Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators
} from '@angular/forms';
import { Utils, ValidateNumberValue, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';

@Component({
  selector: 'b3n-test-item-array',
  templateUrl: './test-item-array.component.html',
  styleUrls: ['./test-item-array.component.scss']
})
export class TestItemArrayComponent implements OnInit {
  @Input() formItem: UntypedFormGroup;
  formArray: UntypedFormArray;

  getErrorInput(ctrl: UntypedFormControl | AbstractControl) {
    return Utils.getErrorInput(ctrl);
  }

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {
    this.formArray = this.formItem.get('arrayItems') as UntypedFormArray;
  }

  addItem(formInput: UntypedFormGroup) {
    const formValue = formInput.getRawValue();
    const formArray = formInput.get('arrayItems') as UntypedFormArray;
    const formItem = this.fb.array([]);
    formValue.arrayItemsSample.forEach(i => {
      let form;
      if (i.dataType === 'array') {
        form = this.fb.group({
          path: i.key,
          title: this.fb.control({ value: i.title, disabled: true }),
          dataType: this.fb.control({ value: i.dataType, disabled: true }),
          arrayItemDataType: this.fb.control({ value: i.arrayItemDataType, disabled: true }),
          arrayItemsSample: this.fb.control({ value: i.arrayItems, disabled: true }),
          arrayItems: this.fb.array([], Validators.required)
        });
      } else {
        form = this.fb.group({
          path: formValue.arrayItemDataType === 'object' ? i.key : '$',
          title: this.fb.control({ value: i.title, disabled: true }),
          dataType: this.fb.control({ value: i.dataType, disabled: true }),
          value: [
            null,
            Utils.validateInput({
              required: true,
              dataType: i.dataType,
              maxlength: ValidateStringMaxLength.USER_INPUT,
              max: ValidateNumberValue.MAX,
              min: ValidateNumberValue.MIN
            })
          ]
        });
        form.get('value').valueChanges.subscribe(value => {
          if (form.get('dataType').value === 'number') {
            form.get('value').setValue(Utils.convertValue(value, 'number'), { emitEvent: false });
          }
        });
      }
      formItem.push(form);
    });
    formArray.push(formItem);
  }

  removeItem(formArray: UntypedFormArray, index: number) {
    formArray.removeAt(index);
  }
}
