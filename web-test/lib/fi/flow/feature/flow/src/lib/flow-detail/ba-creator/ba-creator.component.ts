import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { BodyParameter } from '@b3networks/api/flow';
import { Utils } from '@b3networks/fi/flow/shared';
import { SharedInputParamComponent } from '../shared-input-param/shared-input-param.component';

@Component({
  selector: 'b3n-ba-creator',
  templateUrl: './ba-creator.component.html',
  styleUrls: ['./ba-creator.component.scss']
})
export class BaCreatorComponent extends SharedInputParamComponent implements OnInit {
  @Input() isEdit: boolean;
  @Output() changeInput = new EventEmitter<BodyParameter[]>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  formBaCreator: UntypedFormGroup;

  get inputParameters(): UntypedFormArray {
    return this.formBaCreator.get('input.parameters') as UntypedFormArray;
  }

  override ngOnInit(): void {
    super.ngOnInit();

    if (this.isEdit) {
      this.formBaCreator = this.fb.group({
        input: this.fb.group({
          parameters: this.createForms(this.flow.businessActionInput.parameters)
        })
      });
    } else {
      this.formBaCreator = this.fb.group({
        input: this.fb.group({
          parameters: this.fb.array([])
        })
      });
    }

    if (!this.flow.editable) {
      this.formBaCreator.disable();
    }

    setTimeout(() => {
      this.emitValue();
    });

    this.formBaCreator.valueChanges.subscribe(() => {
      this.emitValue();
    });
  }

  addInputParam() {
    this.inputParameters.push(this.initForm());
  }

  removeInputParam(index: number) {
    this.inputParameters.removeAt(index);
  }

  drop(event: CdkDragDrop<AbstractControl[]>) {
    Utils.moveItemInFormArray(this.inputParameters, event.previousIndex, event.currentIndex);
    this.emitValue();
  }

  private emitValue() {
    const data = this.inputParameters.value;
    data.forEach(p => {
      if (p.visibilityDep?.conditions.length == 0 || p.hidden) {
        p.visibilityDep = null;
      }

      if (!p.customRegexValidation?.pattern || p.hidden) {
        p.customRegexValidation = null;
      }
    });

    if (this.formBaCreator.valid) {
      this.changeInput.emit(data);
      this.invalid.emit(false);
    } else {
      this.invalid.emit(true);
    }
  }
}
