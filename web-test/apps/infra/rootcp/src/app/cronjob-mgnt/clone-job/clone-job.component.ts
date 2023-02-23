import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChronosService } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { StoreCronjobComponent } from '../store-cronjob/store-cronjob.component';

@Component({
  selector: 'b3n-clone-job',
  templateUrl: './clone-job.component.html',
  styleUrls: ['./clone-job.component.scss']
})
export class CloneJobComponent implements OnInit {
  get name() {
    return this.form.get('name');
  }

  isLoading = false;
  form: UntypedFormGroup;
  constructor(
    private fb: UntypedFormBuilder,
    private chronosService: ChronosService,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<StoreCronjobComponent>,
    @Inject(MAT_DIALOG_DATA) public ele
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', Validators.required]
    });
  }

  clone() {
    this.isLoading = true;
    this.chronosService
      .cloneJob(this.ele.category, this.ele.name, this.name.value)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        res => {
          this.toastService.success('Clone Job success');
          this.dialogRef.close(res);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
