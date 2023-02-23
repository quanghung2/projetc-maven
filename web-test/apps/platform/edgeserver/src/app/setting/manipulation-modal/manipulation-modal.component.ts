import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ManipulationProfile, ManipulationService, PreConfig } from '@b3networks/api/edgeserver';
import { finalize } from 'rxjs/operators';

export interface ManipulationModalInput {
  isEdit: boolean;
  manipulation: ManipulationProfile;
  preConfig: PreConfig;
  cluster: string;
}

@Component({
  selector: 'b3n-manipulation-modal',
  templateUrl: './manipulation-modal.component.html',
  styleUrls: ['./manipulation-modal.component.scss']
})
export class ManipulationModalComponent implements OnInit {
  conditions: UntypedFormArray;
  statements: UntypedFormArray;
  antiactions: UntypedFormArray;
  formGroup: UntypedFormGroup;
  isLoading: boolean;
  manipulationModalInput: ManipulationModalInput;
  manipulation: ManipulationProfile;

  defined_antiactions = [];
  limitation = {};

  chipList_visible = true;
  chipList_selectable = true;
  chipList_removable = true;
  chipList_addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: ManipulationModalInput,
    private fb: UntypedFormBuilder,
    private manipulationService: ManipulationService,
    private dialogRef: MatDialogRef<ManipulationModalComponent>
  ) {
    this.manipulationModalInput = this.data;
    this.manipulation = this.manipulationModalInput.manipulation;
    this.defined_antiactions = [...this.manipulationModalInput.preConfig.manipulation['defined_antiactions']];
    this.limitation = this.manipulationModalInput.preConfig.limitation.manipulation;
    this.initForm();
  }

  ngOnInit(): void {
    this.initData();
  }

  private initForm() {
    const { isEdit, manipulation, preConfig } = this.manipulationModalInput;
    this.formGroup = this.fb.group({
      name: [
        { value: manipulation?.name, disabled: isEdit },
        [Validators.required, Validators.pattern(preConfig?.pattern?.name)]
      ],
      conditions: this.fb.array([]),
      statements: this.fb.array([]),
      antiactions: this.fb.array([])
    });
    this.conditions = this.formGroup.controls['conditions'] as UntypedFormArray;
    this.statements = this.formGroup.controls['statements'] as UntypedFormArray;
    this.antiactions = this.formGroup.controls['antiactions'] as UntypedFormArray;
  }

  private initData() {
    if (this.manipulation.conditions?.length) {
      this.conditions.removeAt(0);
      this.manipulation.conditions.forEach(condition => {
        const conditionControls = new UntypedFormGroup({
          variable: new UntypedFormControl(condition?.variable),
          pattern: new UntypedFormControl(condition?.pattern)
        });
        this.conditions.push(conditionControls);
      });
    }
    if (this.manipulation.statements?.length) {
      this.statements.removeAt(0);
      this.manipulation.statements.forEach(statement => {
        const statementsControls = new UntypedFormGroup({
          reference: new UntypedFormControl(statement?.reference),
          pattern: new UntypedFormControl(statement?.pattern),
          target: new UntypedFormControl(statement?.target),
          values: new UntypedFormControl(statement?.values)
        });
        this.statements.push(statementsControls);
      });
    }
    if (this.manipulation.antiactions?.length) {
      this.antiactions.removeAt(0);
      this.manipulation.antiactions.forEach(antiaction => {
        const antiactionsControls = new UntypedFormGroup({
          action: new UntypedFormControl(antiaction?.action),
          param: new UntypedFormControl(antiaction?.param)
        });
        this.antiactions.push(antiactionsControls);
      });
    }
  }

  onSave() {
    this.statements.value.forEach(statement => {
      statement.reference = statement.reference || null;
      statement.pattern = statement.pattern || null;
    });
    const request: ManipulationProfile = {
      name: this.formGroup.controls['name'].value,
      conditions: this.conditions.value,
      statements: this.statements.value,
      antiactions: this.antiactions.value
    };

    if (this.manipulationModalInput?.isEdit) {
      this.updateManipulationProfile(request);
      return;
    }
    this.createManipulationProfile(request);
  }

  private createManipulationProfile(request: ManipulationProfile) {
    this.isLoading = true;
    this.manipulationService
      .createManipulation(request, this.manipulationModalInput.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        error => {
          this.dialogRef.close({ success: false, error });
        }
      );
  }

  private updateManipulationProfile(request: ManipulationProfile) {
    this.isLoading = true;
    this.manipulationService
      .updateManipulation(request, this.manipulationModalInput.cluster)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(
        res => {
          this.dialogRef.close({ success: true });
        },
        error => {
          this.dialogRef.close({ success: false, error });
        }
      );
  }

  addFormGroup(groupName: string) {
    switch (groupName) {
      case 'condition': {
        const controls = new UntypedFormGroup({
          variable: new UntypedFormControl('', Validators.required),
          pattern: new UntypedFormControl('', Validators.required)
        });
        this.conditions.push(controls);
        break;
      }
      case 'antiaction': {
        const controls = new UntypedFormGroup({
          action: new UntypedFormControl('', Validators.required),
          param: new UntypedFormControl('', Validators.required)
        });
        this.antiactions.push(controls);
        break;
      }
      case 'statement': {
        const controls = new UntypedFormGroup({
          reference: new UntypedFormControl(''),
          pattern: new UntypedFormControl(''),
          target: new UntypedFormControl('', Validators.required),
          values: new UntypedFormControl([])
        });
        this.statements.push(controls);
        break;
      }
      default:
        break;
    }
  }

  removeFormGroup(index: number, groupName: string) {
    switch (groupName) {
      case 'condition':
        this.conditions.removeAt(index);
        break;
      case 'antiaction':
        this.antiactions.removeAt(index);
        break;
      case 'statement':
        this.statements.removeAt(index);
        break;
      default:
        break;
    }
  }

  addValues(event: MatChipInputEvent, values: string[]): void {
    const input = event.input;
    const value = event.value;
    if ((value || '').trim()) {
      values.push(value.trim());
    }
    if (input) {
      input.value = '';
    }
  }

  removeValues(value: string, values: string[]): void {
    const index = values.indexOf(value);

    if (index >= 0) {
      values.splice(index, 1);
    }
  }
}
