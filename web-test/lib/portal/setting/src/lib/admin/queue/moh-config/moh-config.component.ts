import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CallflowConfig, MohConfig, QueueConfig, QueueInfo, QueueService, TtsConfig } from '@b3networks/api/callcenter';
import { FileService, S3Service, Status, UploadEvent } from '@b3networks/api/file';
import { ToastService } from '@b3networks/shared/ui/toast';
import { delay, finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-moh-config',
  templateUrl: './moh-config.component.html',
  styleUrls: ['./moh-config.component.scss']
})
export class MohConfigComponent implements OnInit {
  loading: boolean;
  saving: boolean;
  queue: QueueConfig;
  marketings: TtsConfig[] = [];
  background: TtsConfig;
  backgroundUploading = false;
  backgroundUploadProgress = 0;
  audioUrl: string;
  fileName: string;

  fileUrl: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private s3Service: S3Service,
    private toastService: ToastService,
    public dialogRef: MatDialogRef<MohConfigComponent>,
    private queueService: QueueService,
    private fileService: FileService
  ) {}

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading = true;
    this.queueService
      .getQueueConfig(this.data.uuid)
      .pipe(
        delay(400),
        finalize(() => (this.loading = false))
      )
      .subscribe(
        queue => {
          this.queue = queue;
          this.marketings = this.queue.callflowConfig.mohConfig.marketings;
          this.background = this.queue.callflowConfig.mohConfig.background || TtsConfig.createMp3Tts();
          this.background.background = true;

          this.getDownloadableUrl(this.background);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  save() {
    const mohConfig = new MohConfig(this.queue.callflowConfig.mohConfig.xml());
    mohConfig.marketings = this.marketings;
    mohConfig.background = this.background;
    this.queue.callflowConfig.mohConfig = mohConfig;

    this.saving = true;
    const config = {
      callflowConfig: new CallflowConfig()
    } as QueueConfig;
    config.callflowConfig.mohConfig = mohConfig;

    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        queue => {
          this.queue = queue;
          this.dialogRef.close();
          this.toastService.success('Music on hold has been updated.');
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  addNewMarketingMsg() {
    this.marketings = [].concat(this.marketings);
    this.marketings.push(new TtsConfig('New Marketing Message'));
  }

  removeMarketingMsg(index: number) {
    this.marketings.splice(index, 1);
  }

  onBackgroundFileChange(event) {
    if (event.target.files.length > 0) {
      this.backgroundUploading = true;
      const file = event.target.files[0];

      if (!this.isValidFileType(file)) {
        return;
      }

      let uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
      this.s3Service.generalUpload(file, 'communication/tts').subscribe(
        res => {
          uploadEvent = res;
          if (uploadEvent.status === Status.PROCESSING || uploadEvent.status === Status.COMPLETED) {
            this.backgroundUploadProgress = uploadEvent.percentage;
          } else if (uploadEvent.status === Status.CANCELED) {
            this.toastService.error('Update canceled.');
            this.backgroundUploading = false;
          }

          if (uploadEvent.status === Status.COMPLETED) {
            this.background.msgUrl = res.keyForSignApi;
            this.background.privateAcl = true;

            this.getDownloadableUrl(this.background);
            this.toastService.success('Upload successfully');
          }
        },
        () => {
          this.toastService.error('Error! Can not upload file.');
          this.backgroundUploading = false;
        }
      );
    }
  }

  private getDownloadableUrl(tts: TtsConfig) {
    if (tts && tts.privateAcl) {
      this.fileService.downloadFileV3(tts.msgUrl).subscribe(response => {
        const downloadFile = new Blob([response.body], { type: `${response.body.type}` });
        this.audioUrl = window.URL.createObjectURL(downloadFile);
        this.backgroundUploading = false;
      });
    } else if (tts) {
      this.audioUrl = tts.msgUrl;
    }
  }

  isValidFileType(file: { name: string; type: string }) {
    return /.*\.mp3$/.test(file.name) || file.type === 'audio/mp3';
  }
}
