import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QueueInfo, QueueService } from '@b3networks/api/callcenter';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-delete-queue',
  templateUrl: './delete-queue.component.html',
  styleUrls: ['./delete-queue.component.scss']
})
export class DeleteQueueComponent implements OnInit {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private queueService: QueueService,
    private spinnerService: LoadingSpinnerSerivce,
    public dialogRef: MatDialogRef<DeleteQueueComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  delete() {
    this.spinnerService.showSpinner();
    this.queueService
      .deleteQueue(this.data.uuid)
      .pipe(finalize(() => this.spinnerService.hideSpinner()))
      .subscribe(
        res => {
          this.dialogRef.close('deleted');
          this.toastService.success('Delete successfully');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
