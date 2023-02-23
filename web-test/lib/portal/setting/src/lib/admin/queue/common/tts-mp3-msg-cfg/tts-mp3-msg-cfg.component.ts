import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { languages, TtsConfig } from '@b3networks/api/callcenter';
import { FileService, S3Service, Status, UploadEvent } from '@b3networks/api/file';
import { VoicesService } from '@b3networks/comms/callcenter/shared';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-tts-mp3-msg-cfg',
  templateUrl: './tts-mp3-msg-cfg.component.html',
  styleUrls: ['./tts-mp3-msg-cfg.component.scss']
})
export class TtsMp3MsgCfgComponent implements OnInit {
  pitchNRate: any[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

  @Input() ttsCfg: TtsConfig;
  @Input() showPlay: boolean;
  @Input() showNote: boolean;
  @Output() isErrorMsg = new EventEmitter<boolean>();
  uuid =
    new Date().getTime() +
    '-' +
    Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  showAdvance = false;
  voices = {};
  voiceCodes = [];
  langCodes = [];
  languages = languages;

  audioUploading = false;
  audioUploadProgress = 0;
  note: string;
  fileUrl: string;
  fileName: string;

  constructor(
    private voicesService: VoicesService,
    private s3Service: S3Service,
    private toastService: ToastService,
    private fileService: FileService
  ) {}

  ngOnInit() {
    this.getDownloadableUrl(this.ttsCfg);
    this.langCodes = Object.keys(languages);
    this.voicesService.findVoices().subscribe(voices => {
      this.voices = voices;
      this.changeLanguage(this.ttsCfg.language);
    });
    this.note = 'Allow input place holder into parameters, headers and url. Ex: ' + this.ttsCfg.msg;
  }

  changeLanguage(langCode: string) {
    this.ttsCfg.language = langCode;
    this.voiceCodes = Object.keys(this.voices[langCode]);
  }

  updateVoiceCfg() {
    this.ttsCfg.vendor = this.voices[this.ttsCfg.language][this.ttsCfg.voiceCode].vendor;
    this.ttsCfg.gender = this.voices[this.ttsCfg.language][this.ttsCfg.voiceCode].gender;
  }

  onFileChange(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.toastService.error('Exceeded the maximum file size (5MB)');
        return;
      }

      this.audioUploading = true;
      if (!this.isValidFileType(file)) {
        this.toastService.error('invalid file type');
        return;
      }

      let uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
      this.s3Service.generalUpload(file, 'communication/tts').subscribe(
        res => {
          uploadEvent = res;
          if (uploadEvent.status === Status.PROCESSING || uploadEvent.status === Status.COMPLETED) {
            this.audioUploadProgress = uploadEvent.percentage;
          } else if (uploadEvent.status === Status.CANCELED) {
            this.toastService.error('Update canceled.');
            this.audioUploading = false;
          }

          if (uploadEvent.status === Status.COMPLETED) {
            this.ttsCfg.msgUrl = res.keyForSignApi;
            this.ttsCfg.privateAcl = true;

            this.fileService.downloadFileV3(res.keyForSignApi).subscribe(response => {
              const downloadFile = new Blob([response.body], { type: `${response.body.type}` });
              this.fileUrl = window.URL.createObjectURL(downloadFile);
              this.audioUploading = false;
            });
            this.toastService.success('Upload successfully');
          }
        },
        _ => {
          this.toastService.error('Error! Can not upload file.');
          this.audioUploading = false;
        }
      );
    }
  }

  isValidFileType(file: { name: string; type: string }) {
    return /.*\.mp3$/.test(file.name) || file.type === 'audio/mp3';
  }

  private getDownloadableUrl(tts: TtsConfig) {
    if (tts && tts.privateAcl) {
      this.fileService.downloadFileV3(tts.msgUrl).subscribe(response => {
        const downloadFile = new Blob([response.body], { type: `${response.body.type}` });
        this.fileUrl = window.URL.createObjectURL(downloadFile);
      });
    } else if (tts) {
      this.fileUrl = tts.msgUrl;
    }
  }

  displayErrorMsg(isErrorMsg: boolean) {
    this.isErrorMsg.emit(isErrorMsg);
  }
}
