import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ConsentService } from '@b3networks/api/dnc';
import { S3Service, Status } from '@b3networks/api/file';
import { SampleFileService } from '@b3networks/comms/callcenter/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-upload-consent',
  templateUrl: './upload-consent.component.html',
  styleUrls: ['./upload-consent.component.scss']
})
export class UploadConsentComponent implements OnInit {
  @Output() uploadDoneEvent = new EventEmitter<boolean>();
  @Output() uploadEvent = new EventEmitter<boolean>();

  disableUploaderReason: string;
  backgroundUploading = false;
  uploadFileProgress = 0;
  uploadFileName: string;
  isDisableUploader: boolean;

  constructor(
    private s3Service: S3Service,
    private sampleFileService: SampleFileService,
    private toastService: ToastService,
    private consentService: ConsentService
  ) {}

  ngOnInit() {}

  downloadSampleFileService() {
    this.sampleFileService.downloadSampleConsentCSVFile();
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
        .generalUpload(uploadedFile, 'uploads', 'globaldnc')
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
              console.log('res: ', res);
              this.consentService.import(res.keyForSignApi).subscribe(
                () => {
                  this.backgroundUploading = false;
                  this.toastService.success(`Uploaded successfully!`);
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
