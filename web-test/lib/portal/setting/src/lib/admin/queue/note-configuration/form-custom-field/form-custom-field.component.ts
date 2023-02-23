import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import {
  AbstractControl,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { DetailCustomField, TypeCustomField } from '@b3networks/api/callcenter';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  selector: 'b3n-form-custom-field',
  templateUrl: './form-custom-field.component.html',
  styleUrls: ['./form-custom-field.component.scss']
})
export class FormCustomFieldComponent implements OnInit, OnChanges {
  @Input() type: TypeCustomField; // detect onchange type custom field
  @Input() customFields: DetailCustomField[]; // check duplicate questions

  @Output() add = new EventEmitter<DetailCustomField>();

  readonly TypeCustomField = TypeCustomField;

  matcher = new MyErrorStateMatcher();
  group: UntypedFormGroup;

  get key() {
    return this.group.get('key');
  }

  get options() {
    return this.group.get('options');
  }

  get choices(): UntypedFormArray {
    return this.group.get('choices') as UntypedFormArray;
  }

  constructor(private fb: UntypedFormBuilder) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['type']) {
      this.group = this.fb.group({}); // reset
      this.group = this.fb.group({
        key: ['', [Validators.required, this.checkDuplicate(this.customFields)]]
      });
      if (this.type === TypeCustomField.singleChoiceField || this.type === TypeCustomField.multipleChoiceField) {
        this.group.addControl('options', this.fb.control('', this.checkMinLength(1)));
        this.group.addControl('choices', this.fb.array([]));
      }
    }
  }

  addOption(value: string) {
    if (!value) {
      return;
    }
    if (this.choices.value.indexOf(value) === -1) {
      this.choices.push(this.fb.control(value));
      this.options.setValue('');
    }
  }

  removeOption(index: number) {
    this.choices.removeAt(index);
    this.options.updateValueAndValidity();
  }

  dropFieldOptions(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.choices.value, event.previousIndex, event.currentIndex);
  }

  addMore() {
    const customField = <DetailCustomField>{
      key: this.key.value,
      type: this.type,
      options: this.choices?.value || []
    };
    this.add.emit(customField);
  }

  checkDuplicate(customFields: DetailCustomField[]): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } => {
      const isDuplicate = customFields?.some(item => item?.key.trim() === control.value?.trim());
      return isDuplicate ? { duplicate: true } : null;
    };
  }

  checkMinLength(min: number): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } => {
      if (control?.parent?.get('choices')?.value?.length >= min) {
        return null;
      }
      return { minLength: true };
    };
  }
}
