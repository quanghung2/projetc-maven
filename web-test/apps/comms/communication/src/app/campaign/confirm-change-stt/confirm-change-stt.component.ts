import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CampaignLicenseInfo, CampaignLicenseService, Status } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { catchError, finalize } from 'rxjs/operators';
import { ScheduleCampaignComponent } from '../schedule-campaign/schedule-campaign.component';

@Component({
  selector: 'b3n-confirm-change-stt',
  templateUrl: './confirm-change-stt.component.html',
  styleUrls: ['./confirm-change-stt.component.scss']
})
export class ConfirmChangeStatusComponent implements OnInit {
  conversionTarget: string;
  processing: boolean;
  numberListData: CampaignLicenseInfo;
  Status = Status;

  constructor(
    private campaignService: CampaignLicenseService,
    public dialogRef: MatDialogRef<ConfirmChangeStatusComponent>,
    private toastService: ToastService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) private data: CampaignLicenseInfo
  ) {
    this.numberListData = Object.assign({}, this.data);
  }

  ngOnInit() {
    if (this.numberListData.checkDnc && this.numberListData.status === Status.draft) {
      this.conversionTarget = Status.checking;
    } else if (this.numberListData.status === Status.published) {
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
        .publishCampaignV2(this.numberListData.uuid)
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
        .pauseCampaignV2(this.numberListData.uuid)
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
    } else if (this.conversionTarget === Status.checking) {
      this.campaignService
        .checkDncV2(this.numberListData.uuid)
        .pipe(
          catchError(err => {
            this.toastService.error(err.message);
            throw err;
          })
        )
        .subscribe((res: CampaignLicenseInfo) => {
          if (res.uuid) {
            this.processing = false;
            this.dialogRef.close(res);
          }
        });
    }
  }

  startSchedule() {
    const dialogRef = this.dialog.open(ScheduleCampaignComponent, {
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
