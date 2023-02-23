import { KeyValue } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { ControlContainer, NgForm } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { FileService, S3Service, Status, UploadEvent } from '@b3networks/api/file';
import { languages, Text2Speech, TtsConfig, TtsService, TTSType, TtsVendor } from '@b3networks/api/ivr';
import { ToastService } from '@b3networks/shared/ui/toast';
import * as _ from 'lodash';
import { PlaceholderComponent } from '../../placeholder/placeholder.component';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

@Component({
  selector: 'b3n-tts',
  templateUrl: './tts.component.html',
  styleUrls: ['./tts.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class TtsComponent implements OnInit, OnChanges {
  readonly TTSType = TTSType;
  readonly radioOptions: KeyValue<TTSType, string>[] = [
    { key: TTSType.speech, value: `Text to speech` },
    { key: TTSType.mp3, value: `MP3 file (5MB)` }
  ];

  @Input() blockUuid: string;
  @Input() text2Speech: Text2Speech;
  @Input() isPlayBlock = false;
  @Input() isGatherBlock = false;

  languages = languages;
  languageCodes = Object.keys(languages);
  workflowUuid: string;

  constructor(
    private ttsService: TtsService,
    private s3Service: S3Service,
    private dialog: MatDialog,
    private route: ActivatedRoute,
    private fileService: FileService,
    private toatService: ToastService
  ) {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.text2Speech.entries.length == 0) {
      this.addMoreTTS();
    } else {
      this.text2Speech.entries.forEach(item => {
        if (item.type == TTSType.speech) {
          const ttsVendors = this.ttsService.findTtsVendors(item.language);
          item.gender = item.gender ? item.gender : 'FEMALE';
          item.voiceCode = item.voiceCode ? item.voiceCode : 'en-US-WaveNet-F';
          item.vendor = item.vendor ? item.vendor : 'GOOGLE';
          const selectedTtsVendor = this.ttsService.findTtsVendor(item.language, item.voiceCode);
          item.updateVendorData(selectedTtsVendor, ttsVendors);
        } else if (item.s3Key) {
          item.url = null;
          this.fileService.downloadFileV3(item.s3Key).subscribe(response => {
            const downloadFile = new Blob([response.body], { type: `${response.body.type}` });
            item.url = window.URL.createObjectURL(downloadFile);
          });
        }
      });
    }
    this.reloadSource();
  }

  ttsTypeChanged(tts: TtsConfig, event: MatTabChangeEvent) {
    if (event.tab.textLabel === 'Text To Speech') {
      tts.type = TTSType.speech;
    } else {
      tts.type = TTSType.mp3;
    }
  }

  addMoreTTS() {
    const ttsVendors = this.ttsService.findTtsVendors('en');

    const tts: TtsConfig = new TtsConfig();
    tts.language = 'en';
    tts.updateVendorData(ttsVendors[0], ttsVendors);

    this.text2Speech.entries.push(tts);

    this.updateOrder();
  }

  removeTts(tts: TtsConfig) {
    if (this.text2Speech.entries.length == 1) {
      return;
    }

    this.text2Speech.entries = _.filter(this.text2Speech.entries, (item: TtsConfig) => {
      return item != tts;
    });

    this.updateOrder();
  }

  ttsLanguageChange(tts: TtsConfig) {
    const ttsVendors = this.ttsService.findTtsVendors(tts.language);
    tts.updateVendorData(ttsVendors[0], ttsVendors);
  }

  selectVendor(tts: TtsConfig, selected: TtsVendor) {
    tts.updateVendorData(selected, tts.ttsVendors);
  }

  selectMP3File(event, tts: TtsConfig) {
    tts.uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      if (file.size > MAX_FILE_SIZE) {
        this.toatService.warning(`Exceeded the maximum file size (5MB)`, 4000);
        return;
      }

      tts.uploadIndicator = true;
      this.s3Service.generalUpload(file, 'communication/tts').subscribe(
        res => {
          tts.uploadEvent = res;

          if (res.status === Status.COMPLETED) {
            tts.uploadIndicator = false;
            tts.s3Key = res.keyForSignApi;

            this.fileService.downloadFileV3(res.keyForSignApi).subscribe(response => {
              const downloadFile = new Blob([response.body], { type: `${response.body.type}` });
              const fileUrl = window.URL.createObjectURL(downloadFile);
              tts.url = fileUrl;
              this.reloadSource();
            });
          }
        },
        err => {
          this.toatService.error(err.message);
        }
      );
    } else {
      tts.uploadEvent = <UploadEvent>{ status: Status.NONE, percentage: 0 };
      tts.uploadIndicator = false;
    }
  }

  updateOrder() {
    _.forEach(this.text2Speech.entries, (tts: TtsConfig) => {
      tts.order = this.text2Speech.entries.indexOf(tts);
    });
  }

  openPlaceHolderDialog() {
    this.route.parent.params.subscribe(params => (this.workflowUuid = params[`uuid`]));
    this.dialog.open(PlaceholderComponent, {
      width: `500px`,
      minHeight: `420px`,
      hasBackdrop: false,
      disableClose: true,
      data: { workflowUuid: this.workflowUuid }
    });
  }

  trackByFn(i: number) {
    return i;
  }

  reloadSource() {
    const audioPlayer = <HTMLVideoElement>document.getElementById('myAudio');
    if (audioPlayer != null) {
      audioPlayer.load();
    }
  }

  selectedRadioButtonChange(type: TTSType) {
    this.text2Speech.entries[0].type = type;
    if (type === TTSType.speech && !this.text2Speech.entries[0].language) {
      this.text2Speech.entries[0].language = 'en';
    }
  }
}
