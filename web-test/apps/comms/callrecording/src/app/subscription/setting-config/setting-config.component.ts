import { AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { S3Service } from '@b3networks/api/file';
import { ModalComponent } from '../../app-modal/modal.component';
import { UserService } from '../../shared';
import { LANGUAGES } from './language.const';

declare let jQuery: any;

@Component({
  selector: 'app-setting-config',
  templateUrl: './setting-config.component.html',
  styleUrls: ['./setting-config.component.css']
})
export class SettingConfigComponent implements OnInit, AfterViewInit {
  @Input() config: any;
  @Input() title: string;
  @Input() isShow = false;

  @ViewChild('languageElement', { static: true }) languageElement: ElementRef;

  public randomKey: number = Math.round(Math.random() * 1000);
  public languages = LANGUAGES;
  public mp3Files: any = [];

  constructor(private s3Service: S3Service, private userService: UserService) {}

  static parseFromConfig(config) {
    const response: any = {};

    // for sip
    if (config.isRecord == undefined) {
      response.isRecord = config.status == 'enabled';
    } else {
      response.isRecord = config.isRecord;
    }

    let obj;
    try {
      obj = jQuery(config.msg);
      if (obj.length > 0) {
        if (obj[0].localName == 'speech') {
          response.playType = 'TTS';
          response.languageCode = obj.attr('language');
          response.message = obj.text();
        } else if (obj[0].localName == 'url') {
          response.playType = 'MP3';
          response.mp3Url = obj.text();
        }
      }
    } catch (error) {
      console.log(error);
    }

    if (obj == undefined || obj.length == 0) {
      response.message = config.msg;
      response.languageCode = 'en';
      response.playType = 'TTS';
    }

    response.isPlayMessage =
      (response.message != undefined && response.message.length > 0) || response.mp3Url != undefined;
    return response;
  }

  static parseToConfig(config: any) {
    const response: any = {};
    // for direct line
    response.isRecord = config.isRecord;
    // for sip
    response.status = config.isRecord ? 'enabled' : 'disabled';

    if (config.isPlayMessage) {
      if (config.playType == 'MP3') {
        if (config.mp3Url != undefined) {
          response.msg = `<url>${config.mp3Url}</url>`;
        }
      } else if (config.playType == 'TTS') {
        response.msg = config.message;

        if (
          response.msg != undefined &&
          response.msg.length > 0 &&
          config.languageCode != undefined &&
          config.languageCode != 'en'
        ) {
          response.msg = `<speech language="${config.languageCode}" gender="female">${response.msg}</speech>`;
        }
      }
    }
    return response;
  }

  ngOnInit() {}

  ngAfterViewInit() {
    jQuery(this.languageElement.nativeElement)
      .dropdown({
        fullTextSearch: true,
        onChange: value => {
          this.config.languageCode = value;
        }
      })
      .dropdown('set selected', this.config.languageCode);
  }

  setPlayType(type: string) {
    this.config.playType = type;
  }

  onFileChange(event) {
    const user = this.userService.getCurrentUser();
    jQuery.each(event.target.files, (index, file) => {
      if (!this.isValidFileType(file)) {
        // show notification
        return;
      }

      this.mp3Files[index] = {
        index: index,
        file: file,
        name: file.name,
        type: file.type,
        size: file.size,
        status: 'started'
      };

      this.fileUploadS3(this.mp3Files[index]);
    });
    ModalComponent.on('refresh');
  }

  fileUploadS3(file: any) {
    this.s3Service.generalUpload(file.file, 'uploads', 'call-recording').subscribe(
      res => {
        if (res.status === 'processing' || res.status === 'completed') {
          file.percent = res.percentage;
          if (res.status === 'completed') {
            file.completed = true;

            // encode file name
            let url = file.uploader.fileUrl.split('/');
            url[url.length - 1] = encodeURIComponent(url[url.length - 1]);
            url = url.join('/');
            this.config.mp3Url = url;
          }
        } else if (res.status === 'canceled') {
          // notification failure
        }
      },
      err => {
        console.log(err);
      }
    );
  }

  isValidFileType(file: { name: string; type: string }) {
    return /.*\.mp3$/.test(file.name) || file.type == 'audio/mpeg';
  }

  getFileName(url: string) {
    try {
      const path = url.split('/');
      return path[path.length - 1];
    } catch (e) {
      return '';
    }
  }

  parseFileSize(size: number) {
    if (size < 1000) {
      return `${size}b`;
    }
    if (size < 1000000) {
      size = Math.round(size / 1000);
      return `${size}kb`;
    }
    size = Math.round(size / 1000000);
    return `${size}mb`;
  }

  clearMp3Files() {
    this.mp3Files = [];
    delete this.config.mp3Url;
  }
}
