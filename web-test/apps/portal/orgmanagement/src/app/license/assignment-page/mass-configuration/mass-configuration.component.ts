import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { S3Service, Status } from '@b3networks/api/file';
import { JobResp, LicenseJobService } from '@b3networks/api/license';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { timer } from 'rxjs';
import { finalize, mergeMap, switchMap, takeUntil } from 'rxjs/operators';

const INTERVAL_IN_MILISECONDS = 20000;
const MAX_FILE_SIZE = 5 * 1024 * 1000;

@Component({
  selector: 'b3n-mass-configuration',
  templateUrl: './mass-configuration.component.html',
  styleUrls: ['./mass-configuration.component.scss']
})
export class MassConfigurationComponent extends DestroySubscriberComponent implements OnInit {
  backgroundUploading: boolean;
  s3Key: string;
  fileName: string;
  uploading: boolean;
  job: JobResp;
  batchUuid: string;
  refreshing: boolean;
  uploadState: boolean;
  pendingJobPercentage = 0;

  showMoreInfo: boolean;

  constructor(
    private s3Service: S3Service,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<MassConfigurationComponent>,
    private licenseJobService: LicenseJobService
  ) {
    super();
  }

  ngOnInit(): void {}

  onFileChange(event) {
    if (event.target.files.length > 0) {
      this.backgroundUploading = true;

      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        this.backgroundUploading = false;
        this.toastService.error(`Exceeded the maximum file size (5MB)`, 4000);
        return;
      }

      this.s3Service.tempUpload(file).subscribe(
        res => {
          if (res.status === Status.COMPLETED) {
            this.backgroundUploading = false;
            this.fileName = file.name;
            this.s3Key = res.tempKey;
          }
        },
        error => {
          this.toastService.error(error.message);
        }
      );
    }
  }

  submitJob() {
    this.uploading = true;
    this.job = null;
    this.licenseJobService
      .createBulkExtensionJob(this.s3Key)
      .pipe(
        switchMap(res => {
          this.batchUuid = res.batchUuid;
          return this.licenseJobService.getCreateBulkExtensionJobs();
        })
      )
      .pipe(takeUntil(this.destroySubscriber$))
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe(
        jobs => {
          this.uploadState = true;
          this.job = jobs.find(job => job.batchUuid === this.batchUuid);

          this.pollingJobs();
        },
        error => {
          this.uploading = false;
          this.toastService.warning(
            'An error occurred while uploading the file. Please double check the file upload and try again.'
          );
        }
      );
  }

  private pollingJobs() {
    const jobSubscription = timer(0, INTERVAL_IN_MILISECONDS)
      .pipe(
        mergeMap(() => {
          return this.licenseJobService.getCreateBulkExtensionJobs();
        }),
        takeUntil(this.destroySubscriber$)
      )
      .subscribe(jobs => {
        this.job = jobs.find(job => job.batchUuid === this.batchUuid);
        const total = this.job.numOfSuccess + this.job.numOfPending + this.job.numOfFailed;
        this.pendingJobPercentage = ((total - this.job.numOfPending) / total) * 100;

        if (this.pendingJobPercentage < 10) {
          this.pendingJobPercentage = 10;
        }

        if (this.job.numOfPending === 0) {
          jobSubscription.unsubscribe();
        }
      });
  }

  finish() {
    this.dialogRef.close(true);
  }

  toggleMoreInfo() {
    this.showMoreInfo = !this.showMoreInfo;
  }
}
