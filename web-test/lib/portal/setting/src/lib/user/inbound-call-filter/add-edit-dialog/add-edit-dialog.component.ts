import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FilterRule, Rule, RuleAction, RuleType } from '@b3networks/api/bizphone';
import { ExtensionService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { DEFAULT_WARNING_MESSAGE } from '../../../shared/contants';

export interface AddEditDialogData {
  title: string;
  extKey: string;
  incomingFilterRule: FilterRule;
  index: number;
}

@Component({
  selector: 'b3n-add-edit-dialog',
  templateUrl: './add-edit-dialog.component.html',
  styleUrls: ['./add-edit-dialog.component.scss']
})
export class AddEditDialogComponent implements OnInit {
  ruleAction = RuleAction;
  form: UntypedFormGroup;
  defaultAction: string;
  defaultNumber: string[] = [];
  defaultType: string;
  loading: boolean;
  actionMap = {
    block: 'Block Call',
    delegate: 'Ring Delegates',
    forward: 'Forward Call',
    ringDevices: 'Ring Devices'
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: AddEditDialogData,
    private extensionService: ExtensionService,
    private fb: UntypedFormBuilder,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<AddEditDialogComponent>
  ) {}

  ngOnInit(): void {
    if (this.data.index !== -1) {
      const { action, exactMatch, startWith, type } = this.data.incomingFilterRule.customRules[this.data.index];
      this.defaultAction = action;
      this.defaultType = type;
      this.defaultNumber = exactMatch && exactMatch.length ? exactMatch : startWith;
    }

    this.form = this.fb.group({
      matchPattern: [this.defaultType || 'startWith'],
      number: [this.defaultNumber[0] || '', Validators.required],
      action: [this.defaultAction || this.ruleAction.block]
    });
  }

  save(): void {
    this.loading = true;
    const type: RuleType = this.form.controls['matchPattern'].value;
    const number = this.form.controls['number'].value.toString();
    const newRule: Rule = {
      type,
      action: this.form.controls['action'].value
    };

    if (type === 'exactMatch') {
      newRule.exactMatch = [number];
    } else {
      newRule.startWith = [number];
    }

    if (this.data.index === -1) {
      this.data.incomingFilterRule.customRules.push(newRule);
    } else {
      this.data.incomingFilterRule.customRules.splice(this.data.index, 1, newRule);
    }

    this.extensionService
      .update(this.data.extKey, {
        incomingFilterRule: this.data.incomingFilterRule
      })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.dialogRef.close(this.data.index === -1);
        })
      )
      .subscribe(
        _ => {
          this.toastService.success('Apply successfully!');
        },
        error => {
          this.toastService.warning(error.message || DEFAULT_WARNING_MESSAGE);
        }
      );
  }

  srcPrefixKeyDown(e: KeyboardEvent) {
    if (['e', 'E', '-', '.'].includes(e.key)) {
      e.preventDefault();
    }
  }

  get number() {
    return this.form.controls['number'];
  }
}
