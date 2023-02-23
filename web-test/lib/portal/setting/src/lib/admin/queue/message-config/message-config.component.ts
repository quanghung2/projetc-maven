import { STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatStepper } from '@angular/material/stepper';
import { CallflowConfig, QueueConfig, QueueInfo, QueueService, TtsConfig } from '@b3networks/api/callcenter';
import { FileService, S3Service, Status, UploadEvent } from '@b3networks/api/file';
import { ToastService } from '@b3networks/shared/ui/toast';
import { delay, finalize, map } from 'rxjs';

const URL_MOH_DEFAULT = 'https://ui.b3networks.com/samples/sample_moh.mp3';

@Component({
  selector: 'b3n-message-config',
  templateUrl: './message-config.component.html',
  styleUrls: ['./message-config.component.scss'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { displayDefaultIndicatorType: false }
    }
  ]
})
export class MessageConfigComponent implements OnInit {
  loading = false;
  queue: QueueConfig;
  welcomeMsg: TtsConfig;
  gatherMsg: TtsConfig;
  marketingMsg: TtsConfig;
  background: TtsConfig;
  backgroundUploading = false;
  backgroundUploadProgress = 0;
  audioUrl: string;
  fileName: string;
  fileUrl: string;
  hangupMsgOnMaxGatherTimes: TtsConfig;
  isEnableInitMsg: boolean;
  isEnableMarketingMsg: boolean;
  isEnableUpdateMsg: boolean;
  saving: boolean;
  isErrorMsg: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: QueueInfo,
    private queueService: QueueService,
    private toastService: ToastService,
    private fileService: FileService,
    private s3Service: S3Service,
    private dialogRef: MatDialogRef<MessageConfigComponent>
  ) {
    this.reload();
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  ngOnInit() {}

  updateMsgConfig() {
    if (this.isErrorMsg) return;
    const config = {
      callflowConfig: {
        welcomeMsg: this.isEnableInitMsg ? this.welcomeMsg.xml() : '',
        marketingMsg: this.isEnableMarketingMsg ? this.marketingMsg.xml() : '',
        musicOnHold: this.background.xml(),
        waitTime: this.queue.callflowConfig.waitTime,
        gatherMsg: this.isEnableUpdateMsg ? this.gatherMsg.xml() : '',
        gatherTimeout: this.queue.callflowConfig.gatherTimeout
      } as CallflowConfig
    } as QueueConfig;

    this.saving = true;
    this.queueService
      .updateQueueConfig(this.data.uuid, config)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        queue => {
          this.queue = queue;
          this.toastService.success('Messages have been updated.');
          this.dialogRef.close();
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  onErrorLoadFile() {
    this.toastService.error('Cannot load file');
  }

  onBackgroundFileChange(event) {
    if (event.target.files.length > 0) {
      this.backgroundUploading = true;
      const file = event.target.files[0];

      if (!this.isValidFileType(file)) return;

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

  private reload() {
    this.loading = true;
    this.queueService
      .getQueueConfig(this.data.uuid)
      .pipe(
        map(res => {
          const obj = Object.assign(new QueueConfig(), res);
          obj.callflowConfig = Object.assign(new CallflowConfig(), res.callflowConfig);
          return obj;
        }),
        delay(400),
        finalize(() => (this.loading = false))
      )
      .subscribe(
        queue => {
          const {
            welcomeMsg,
            marketingMsg,
            gatherMsg,
            welcomeMsgConfig,
            gatherMsgConfig,
            marketingMsgConfig,
            mohConfig
          } = queue.callflowConfig;
          this.queue = queue;
          this.isEnableInitMsg = !!welcomeMsg;
          this.isEnableMarketingMsg = !!marketingMsg;
          this.isEnableUpdateMsg = !!gatherMsg;
          this.welcomeMsg = welcomeMsgConfig;
          this.gatherMsg = gatherMsgConfig;
          this.marketingMsg = marketingMsgConfig;
          if (mohConfig.background) {
            this.background = mohConfig.background;
          } else {
            this.background = TtsConfig.createMp3Tts();
            this.background.msgUrl = URL_MOH_DEFAULT;
          }
          this.background.background = true;

          this.getDownloadableUrl(this.background);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }

  private isValidFileType(file: { name: string; type: string }) {
    return /.*\.mp3$/.test(file.name) || file.type === 'audio/mp3';
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

  displayErrorMsg(isErrorMsg: boolean) {
    this.isErrorMsg = isErrorMsg;
  }

  nextStepper(stepper: MatStepper) {
    if (this.isErrorMsg) return;
    stepper.linear = false;
    stepper.next();
    stepper.linear = true;
  }

  previousStepper(stepper: MatStepper) {
    if (this.isErrorMsg) return;
    if (stepper.selectedIndex === 1) return stepper.reset();
    stepper.linear = false;
    stepper.previous();
    stepper.linear = true;
  }
}
