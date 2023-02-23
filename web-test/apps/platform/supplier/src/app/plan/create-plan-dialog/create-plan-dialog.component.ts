import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { SupplierService } from '@b3networks/api/supplier';
import { generateRandomString } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HashMap } from '@datorama/akita';
import { finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'b3n-create-plan-dialog',
  templateUrl: './create-plan-dialog.component.html',
  styleUrls: ['./create-plan-dialog.component.scss']
})
export class CreatePlanDialogComponent implements OnInit {
  stacks: HashMap<string>[];
  formCreatePlan: UntypedFormGroup;
  peerCtrl = new UntypedFormControl('', Validators.required);
  creating: boolean;

  constructor(
    private dialogRef: MatDialogRef<CreatePlanDialogComponent>,
    private fb: UntypedFormBuilder,
    private supplierService: SupplierService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.stacks = environment.stacks;

    this.formCreatePlan = this.fb.group({
      stack: ['', Validators.required],
      name: [generateRandomString(8), Validators.required],
      primary: ['', Validators.required],
      secondary: ['', Validators.required]
    });

    this.peerCtrl.valueChanges.subscribe(str => {
      this.formCreatePlan.patchValue({
        primary: str,
        secondary: str
      });
    });
  }

  generateName() {
    this.formCreatePlan.get('name').setValue(generateRandomString(8));
  }

  create() {
    if (this.formCreatePlan.valid) {
      this.creating = true;
      this.supplierService
        .createPlan(this.formCreatePlan.value)
        .pipe(finalize(() => (this.creating = false)))
        .subscribe(
          _ => {
            this.dialogRef.close(true);
            this.toastService.success('Create plan successfully');
          },
          err => {
            this.toastService.error(err.message);
          }
        );
    }
  }
}
