import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CampaignLicenseService, CampaignService, Status as NumberListStatus } from '@b3networks/api/callcenter';
import { S3Service, Status } from '@b3networks/api/file';
import { FeatureQuery } from '@b3networks/api/license';
import { SampleFileService } from '@b3networks/comms/callcenter/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-upload-numbers',
  templateUrl: './upload-numbers.component.html',
  styleUrls: ['./upload-numbers.component.scss']
})
export class UploadNumbersComponent implements OnChanges {
  @Input() campaignUuid: string;
  @Input() isFromNumbersDialog: string;
  @Input() numberListStatus: string;
  @Output() uploadDoneEvent = new EventEmitter<boolean>();
  @Output() uploadEvent = new EventEmitter<boolean>();

  disableUploaderReason: string;
  backgroundUploading = false;
  uploadFileProgress = 0;
  uploadFileName: string;
  isDisableUploader: boolean;

  constructor(
    private s3Service: S3Service,
    private campaignService: CampaignService,
    private campaignLicenseService: CampaignLicenseService,
    private sampleFileService: SampleFileService,
    private toastService: ToastService,
    private featureQuery: FeatureQuery,
    private dialog: MatDialog
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['numberListStatus']) {
      switch (this.numberListStatus) {
        case NumberListStatus.checking:
          this.isDisableUploader = true;
          this.disableUploaderReason = 'Cannot upload numbers while the campaign is being checked!';
          break;
        case NumberListStatus.published:
          this.isDisableUploader = true;
          this.disableUploaderReason = 'Cannot upload numbers while the campaign is in process!';
          break;
        case NumberListStatus.finished:
          this.isDisableUploader = true;
          this.disableUploaderReason = 'Cannot upload numbers when the campaign is completed!';
          break;
        default:
          this.isDisableUploader = false;
          this.disableUploaderReason = '';
      }
    }
  }

  downloadSampleFileService() {
    this.sampleFileService.downloadSampleNumberListCSVFile();
  }

  onBackgroundFileChange(event) {
    this.uploadEvent.emit(true);
    let uploadedFile = null;
    if (event.target.files.length > 0) {
      uploadedFile = event.target.files[0];
    }

    if (event.target.files.length > 0) {
      this.backgroundUploading = true;
      this.uploadEvent.emit(true);

      this.s3Service
        .tempUpload(uploadedFile)
        .pipe(finalize(() => (this.backgroundUploading = false)))
        .subscribe(
          res => {
            if (res.status === Status.CANCELED) {
              this.uploadEvent.emit(false);
            }
            if (res.status === Status.PROCESSING) {
              this.uploadFileProgress = res.percentage;
            }
            if (res.status === Status.COMPLETED) {
              const isFlow = this.featureQuery.hasDeveloperLicense;
              let api$;
              if (isFlow) {
                api$ = this.campaignLicenseService.uploadV2(this.campaignUuid, {
                  key: res.tempKey,
                  listName: null,
                  usingTemp: true
                });
              } else {
                api$ = this.campaignService.upload(this.campaignUuid, {
                  key: res.tempKey,
                  usingTemp: true
                });
              }

              api$.subscribe(
                uploadedRes => {
                  this.backgroundUploading = false;
                  this.toastService.success(`Uploaded ${uploadedRes.totalCount} numbers`);
                  this.uploadEvent.emit(false);
                  this.uploadDoneEvent.emit(true);
                },
                () => {
                  this.uploadEvent.emit(false);
                }
              );
            }
          },
          () => {
            this.uploadEvent.emit(false);
          }
        );
    }
  }
}
