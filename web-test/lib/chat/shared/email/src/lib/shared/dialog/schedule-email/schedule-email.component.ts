import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  EmailIntegrationService,
  EmailUploadRequest,
  S3Service,
  SendEmailInboxRequest
} from '@b3networks/api/workspace';
import { takeUntil } from 'rxjs/operators';
import { DestroySubscriberComponent, MessageConstants, randomGuid } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'b3n-schedule-email',
  templateUrl: './schedule-email.component.html'
})
export class ScheduleEmailComponent extends DestroySubscriberComponent {
  scheduleDate: Date;
  minDate = new Date();

  constructor(
    public dialogRef: MatDialogRef<ScheduleEmailComponent>,
    private s3Service: S3Service,
    private emailIntegrationService: EmailIntegrationService,
    private toastService: ToastService,
    @Inject(MAT_DIALOG_DATA) public data: SendEmailInboxRequest
  ) {
    super();
  }

  submit() {
    if (this.scheduleDate) {
      const fileName = `${randomGuid()}.json`;
      const s3Key = `schedule/${new Date().getTime()}/` + fileName;
      this.s3Service
        .uploadObjectToS3(this.data.emailMessage, s3Key)
        .pipe(takeUntil(this.destroySubscriber$))
        .subscribe(_ => {
          const body: EmailUploadRequest = {
            convoUuid: this.data.convoUuid,
            s3Key: s3Key,
            scheduleAt: this.scheduleDate.getTime()
          };
          this.emailIntegrationService.createScheduleEmail(body).subscribe(
            () => {
              this.toastService.success('Schedule email successfully');
              this.dialogRef.close(true);
            },
            error => {
              this.showError(error);
              this.dialogRef.close();
            }
          );
        });
    }
  }

  private showError(error: HttpErrorResponse) {
    this.toastService.error(error && error.message ? error.message : MessageConstants.GENERAL_ERROR);
  }
}
