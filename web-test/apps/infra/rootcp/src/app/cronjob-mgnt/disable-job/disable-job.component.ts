import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChronosService, JobConfig } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { StoreCronjobComponent } from '../store-cronjob/store-cronjob.component';

@Component({
  selector: 'b3n-disable-job',
  templateUrl: './disable-job.component.html',
  styleUrls: ['./disable-job.component.scss']
})
export class DisableJobComponent implements OnInit {
  isLoading: boolean = false;
  constructor(
    private toastService: ToastService,
    private chornosService: ChronosService,
    public dialogRef: MatDialogRef<StoreCronjobComponent>,
    @Inject(MAT_DIALOG_DATA) public ele
  ) {}

  ngOnInit(): void {}

  disable() {
    this.isLoading = true;
    const body = {
      disabled: true
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
          this.toastService.success('Disable job successfully');
          this.dialogRef.close(res);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
