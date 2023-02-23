import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import { ComplianceService } from '@b3networks/api/dnc';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-config-compliance-dialog',
  templateUrl: './config-compliance-dialog.component.html',
  styleUrls: ['./config-compliance-dialog.component.scss']
})
export class ConfigComplianceDialogComponent implements OnInit {
  orgUuidCtrl = new UntypedFormControl('', Validators.required);
  isCompliant: boolean;
  callerIdExclusions: string[];
  getStatusDone: boolean;
  setting: boolean;

  addOnBlur = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    private dialogRef: MatDialogRef<ConfigComplianceDialogComponent>,
    private complianceService: ComplianceService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  getStatus() {
    if (this.orgUuidCtrl.valid) {
      this.setting = true;
      this.complianceService
        .getStatusDncCompliance(this.orgUuidCtrl.value)
        .pipe(finalize(() => (this.setting = false)))
        .subscribe(
          res => {
            this.getStatusDone = true;
            this.isCompliant = res.isCompliant;
            this.callerIdExclusions = res.callerIdExclusions;
          },
          err => this.toastService.error(err)
        );
    }
  }

  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;

    // Add our fruit
    if ((value || '').trim()) {
      this.callerIdExclusions.push(value.trim());
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  remove(str: string): void {
    const index = this.callerIdExclusions.indexOf(str);

    if (index >= 0) {
      this.callerIdExclusions.splice(index, 1);
    }
  }

  setConfig() {
    this.setting = true;
    if (this.isCompliant) {
      this.complianceService
        .updateDncCompliance(this.orgUuidCtrl.value, { callerIdExclusions: this.callerIdExclusions })
        .pipe(finalize(() => (this.setting = false)))
        .subscribe(
          _ => {
            this.toastService.success('Update successfully');
            this.dialogRef.close();
          },
          err => this.toastService.error(err.message)
        );
    } else {
      this.complianceService
        .deleteDncCompliance(this.orgUuidCtrl.value)
        .pipe(finalize(() => (this.setting = false)))
        .subscribe(
          _ => {
            this.toastService.success('Update successfully');
            this.dialogRef.close();
          },
          err => this.toastService.error(err.message)
        );
    }
  }
}
