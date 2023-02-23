import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChronosService, JobConfig } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { StoreCronjobComponent } from '../store-cronjob/store-cronjob.component';

@Component({
  selector: 'b3n-enable-job',
  templateUrl: './enable-job.component.html',
  styleUrls: ['./enable-job.component.scss']
})
export class EnableJobComponent implements OnInit {
  isLoading: boolean = false;
  constructor(
    private toastService: ToastService,
    private chornosService: ChronosService,
    public dialogRef: MatDialogRef<StoreCronjobComponent>,
    @Inject(MAT_DIALOG_DATA) public ele
  ) {}

  ngOnInit(): void {}

  enable() {
    this.isLoading = true;
    const body = {
      disabled: false
    } as JobConfig;
    this.chornosService
      .setJob(this.ele.category, this.ele.name, body)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(
        res => {
          this.toastService.success('Enable job successfully');
          this.dialogRef.close(res);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
