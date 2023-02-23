import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, ValidatorFn, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { DetailCustomField, TypeCustomField } from '@b3networks/api/callcenter';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl): boolean {
    return control && control.invalid && (control.dirty || control.touched);
  }
}

@Component({
  selector: 'b3n-custom-field',
  templateUrl: './custom-field.component.html',
  styleUrls: ['./custom-field.component.scss']
})
export class CustomFieldComponent implements OnInit {
  @ViewChild('editForm') editForm: ElementRef;

  @Input() detailField: DetailCustomField;
  @Input() customFields: DetailCustomField[]; // check duplicate questions
  @Input() index: number;
  @Input() last: boolean;
  @Input() isPositionMode: boolean;

  @Output() valueEdit = new EventEmitter<{ index: number; value: string }>();
  @Output() delete = new EventEmitter<number>();

  readonly TypeCustomField = TypeCustomField;

  matcher = new MyErrorStateMatcher();
  editing: boolean;
  controlEdit: UntypedFormControl;

  constructor(private cdr: ChangeDetectorRef, private fb: UntypedFormBuilder) {}

  ngOnInit(): void {}

  addOption(value: string) {
    if (!value) {
      return;
    }
    if (this.detailField.options.indexOf(value) === -1) {
      this.detailField.options.push(value);
    }
  }

  removeOption(index: number) {
    this.detailField.options.splice(index, 1);
  }

  dropFieldOptions(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.detailField.options, event.previousIndex, event.currentIndex);
  }

  changeField(value) {
    this.valueEdit.emit({ index: this.index, value: value });
    this.editing = false;
    this.controlEdit = null;
  }

  switchEditMode() {
    this.editing = true;
    this.controlEdit = this.fb.control(this.detailField.key, [
      Validators.required,
      this.checkDuplicate(this.customFields, this.detailField.key)
    ]);
    this.cdr.detectChanges();
    this.editForm.nativeElement.focus();
  }

  deleteField() {
    this.delete.emit(this.index);
  }

  checkDuplicate(customFields: DetailCustomField[], self: string): ValidatorFn {
    return (control: AbstractControl): { [key: string]: boolean } => {
      if (control?.value === self) {
        return null;
      }
      const isDuplicate = customFields?.some(item => item?.key.trim() === control.value?.trim());
      return isDuplicate ? { duplicate: true } : null;
    };
  }
}
