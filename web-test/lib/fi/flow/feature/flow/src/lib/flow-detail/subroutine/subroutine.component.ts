import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormGroup } from '@angular/forms';
import { CreateSubroutineReq } from '@b3networks/api/flow';
import { Utils } from '@b3networks/fi/flow/shared';
import { SharedInputParamComponent } from '../shared-input-param/shared-input-param.component';

@Component({
  selector: 'b3n-subroutine',
  templateUrl: './subroutine.component.html',
  styleUrls: ['./subroutine.component.scss']
})
export class SubroutineComponent extends SharedInputParamComponent implements OnInit {
  @Input() isEdit: boolean;
  @Output() changeConfig = new EventEmitter<CreateSubroutineReq>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  @Output() invalid = new EventEmitter<boolean>();

  formSubroutine: UntypedFormGroup;

  get inputParameters(): UntypedFormArray {
    return this.formSubroutine.get('input.parameters') as UntypedFormArray;
  }

  get outputParameters(): UntypedFormArray {
    return this.formSubroutine.get('output.parameters') as UntypedFormArray;
  }

  override ngOnInit(): void {
    super.ngOnInit();

    if (this.isEdit) {
      this.formSubroutine = this.fb.group({
        input: this.fb.group({
          parameters: this.createForms(this.flow.subroutineInput.parameters)
        }),
        output: this.fb.group({
          parameters: this.createForms(this.flow.subroutineOutput.parameters)
        }),
        autoInjectOngoingCallTxn: [{ value: this.flow.autoInjectOngoingCallTxn, disabled: true }]
      });
    } else {
      this.formSubroutine = this.fb.group({
        input: this.fb.group({
          parameters: this.fb.array([])
        }),
        output: this.fb.group({
          parameters: this.fb.array([])
        }),
        autoInjectOngoingCallTxn: false
      });
    }

    if (!this.flow.editable) {
      this.formSubroutine.disable();
    }

    setTimeout(() => {
      this.emitValue();
    });

    this.formSubroutine.valueChanges.subscribe(() => {
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

  addOutputParam() {
    this.outputParameters.push(this.initForm());
  }

  removeOutputParam(index: number) {
    this.outputParameters.removeAt(index);
  }

  private emitValue() {
    const data = this.formSubroutine.value;
    data.input.parameters.forEach(p => {
      if (p.visibilityDep?.conditions.length == 0 || p.hidden) {
        p.visibilityDep = null;
      }

      if (!p.customRegexValidation?.pattern || p.hidden) {
        p.customRegexValidation = null;
      }
    });

    data.output.parameters.forEach(p => {
      if (p.visibilityDep?.conditions.length == 0 || p.hidden) {
        p.visibilityDep = null;
      }

      if (!p.customRegexValidation?.pattern || p.hidden) {
        p.customRegexValidation = null;
      }
    });

    if (this.formSubroutine.valid) {
      this.changeConfig.emit(data);
      this.invalid.emit(false);
    } else {
      this.invalid.emit(true);
    }
  }
}
