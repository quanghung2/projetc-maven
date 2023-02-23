import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignInfo, CampaignService, Status } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { catchError, finalize } from 'rxjs/operators';
import { ScheduleNumberListComponent } from '../schedule-number-list/schedule-number-list.component';

@Component({
  selector: 'b3n-confirm-change-stt',
  templateUrl: './confirm-change-stt.component.html',
  styleUrls: ['./confirm-change-stt.component.scss']
})
export class ConfirmChangeStatusComponent implements OnInit {
  conversionTarget: string;
  processing: boolean;
  numberListData: CampaignInfo;
  Status = Status;

  constructor(
    private campaignService: CampaignService,
    public dialogRef: MatDialogRef<ConfirmChangeStatusComponent>,
    private toastService: ToastService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: CampaignInfo
  ) {
    this.numberListData = Object.assign({}, this.data);
  }

  ngOnInit() {
    if (this.numberListData.status === Status.published) {
      this.conversionTarget = Status.paused;
    } else if (this.numberListData.status === Status.finished) {
      this.conversionTarget = Status.finished;
    } else {
      this.conversionTarget = Status.published;
    }
  }

  onUpdate() {
    this.processing = true;
    if (this.conversionTarget === Status.published) {
      this.campaignService
        .publishCampaign(this.numberListData.uuid)
        .pipe(
          finalize(() => {
            this.processing = false;
          }),
          catchError(err => {
            this.toastService.error(err.message);
            throw err;
          })
        )
        .subscribe(res => {
          this.dialogRef.close(res);
        });
    } else if (this.conversionTarget === Status.paused) {
      this.campaignService
        .pauseCampaign(this.numberListData.uuid)
        .pipe(
          catchError(err => {
            this.toastService.error(err.message);
            this.dialogRef.close(false);
            throw err;
          })
        )
        .subscribe(res => {
          this.processing = false;
          this.dialogRef.close(res);
        });
    }
  }

  startSchedule() {
    const dialogRef = this.dialog.open(ScheduleNumberListComponent, {
      width: '600px',
      maxHeight: '700px',
      data: this.numberListData
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.dialogRef.close(result);
      }
    });
  }
}
