import { Component, Input } from '@angular/core';
import { environment } from 'apps/comms/sip/src/environments/environment';
import { S3Service, Status } from '../../service/s3.service';

declare let jQuery: any;
declare let X: any;

@Component({
  selector: 'ivr-message',
  templateUrl: 'ivr-message.component.html',
  styleUrls: ['ivr-message.component.scss']
})
export class IvrMessageComponent {
  @Input() model: any = {};

  id: string;
  uploading = false;

  availableLanguages: any = [
    { code: 'en', name: 'English' },
    { code: 'en-UK', name: 'English (British)' },
    { code: 'en-AU', name: 'English (Australian)' },
    { code: 'en-CA', name: 'English (Canadian)' },
    { code: 'zh', name: 'Chinese' },
    { code: 'zh-TW', name: 'Chinese (Taiwanese)' },
    { code: 'zh-HK', name: 'Cantonese' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'pt-BR', name: 'Portuguese (Brazilian)' },
    { code: 'fr', name: 'French' },
    { code: 'fr-CA', name: 'French (Canadian)' },
    { code: 'es', name: 'Spanish' },
    { code: 'es-MX', name: 'Spanish (United States)' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'da', name: 'Danish' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'tr', name: 'Turkish' },
    { code: 'ru', name: 'Russian' },
    { code: 'hu', name: 'Hungarian' },
    { code: 'ca', name: 'Catalan' },
    { code: 'cs', name: 'Czech' },
    { code: 'fi', name: 'Finnish' },
    { code: 'no', name: 'Norwegian' },
    { code: 'po', name: 'Polish' },
    { code: 'sv', name: 'Swedish' },
    { code: 'el-GR', name: 'Greek' }
  ];

  constructor(private s3Service: S3Service) {
    this.id = Math.floor(Math.random() * 1000).toString();
  }

  getType(): string {
    const regex = /<url>([\s\S]*?)<\/url>/g;
    if (this.model.msg.match(regex)) {
      return 'mp3';
    }
    return 'tts';
  }

  getLanguage(): string {
    let regex = /<speech language="([^"]*?)" gender="female">([\s\S]*?)<\/speech>/g;
    const matches = this.model.msg.match(regex);
    if (matches) {
      for (const match of matches) {
        regex = /<speech language="([^"]*?)" gender="female">([\s\S]*?)<\/speech>/g;
        const parts = regex.exec(match);
        return parts[1];
      }
    }
    return 'en';
  }

  getMessage(): string {
    let regex = /<speech language="([^"]*?)" gender="female">([\s\S]*?)<\/speech>/g;
    const matches = this.model.msg.match(regex);
    if (matches) {
      for (const match of matches) {
        regex = /<speech language="([^"]*?)" gender="female">([\s\S]*?)<\/speech>/g;
        const parts = regex.exec(match);
        return parts[2];
      }
    }
    return this.model.msg;
  }

  getMp3Url(): string {
    let regex = /<url>([\s\S]*?)<\/url>/g;
    const matches = this.model.msg.match(regex);
    if (matches) {
      for (const match of matches) {
        regex = /<url>([\s\S]*?)<\/url>/g;
        const parts = regex.exec(match);
        return parts[1];
      }
    }
    return '';
  }

  updateMessage(msg) {
    this.model.msg = '<speech language="' + this.getLanguage() + '" gender="female">' + msg + '</speech>';
  }

  updateLanguage(lang) {
    this.model.msg = '<speech language="' + lang + '" gender="female">' + this.getMessage() + '</speech>';
  }

  updateType(type) {
    if (type === 'tts') {
      this.model.msg = '<speech language="en" gender="female"></speech>';
    } else {
      this.model.msg = '<url></url>';
    }
  }

  clearMp3File() {
    this.model.msg = '<url></url>';
  }

  upload(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      const key =
        environment.settings.s3Bucket +
        '/' +
        environment.settings.s3Folder +
        '/' +
        new Date().getTime() +
        '-' +
        event.target.files[0].name.replace(' ', '');
      this.uploading = true;
      const progressBar = jQuery('.ui.progress');
      progressBar.progress({
        percent: 0
      });
      const uploader = this.s3Service.upload(file, key, true).subscribe(
        res => {
          if (res.status === Status.PROCESSING || res.status === Status.COMPLETED) {
            progressBar.progress({ percent: res.percentage });
          }
          if (res.status === Status.COMPLETED) {
            this.model.msg = `<url>${uploader.fileUrl}</url>`;
            this.uploading = false;
          } else if (res.status === Status.CANCELED) {
            this.uploading = false;
          }
        },
        err => {
          this.uploading = false;
          X.showWarn('Error! Can not upload file.');
        }
      );
    }
  }
}
