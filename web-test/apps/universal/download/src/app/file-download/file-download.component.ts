import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FileService } from '@b3networks/api/file';
import { downloadData, LocalStorageUtil } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { switchMap } from 'rxjs/operators';

export interface DownloadFile {
  fileName: string;
  fileSize: string;
  cookieMap: { [Tkey in string]: string };
}

@Component({
  selector: 'b3n-file-download',
  templateUrl: './file-download.component.html',
  styleUrls: ['./file-download.component.scss']
})
export class FileDownloadComponent implements OnInit {
  isInvalidURL: boolean;
  file: DownloadFile;
  downloaded: boolean;

  constructor(
    private route: ActivatedRoute,
    private spinner: LoadingSpinnerSerivce,
    private fileService: FileService
  ) {}

  ngOnInit() {
    this.route.params
      .pipe(
        switchMap(params => {
          this.spinner.showSpinner();
          this.downloaded = false;
          this.isInvalidURL = false;
          this.file = null;

          const fileKey = params['key'];
          if (fileKey) {
            LocalStorageUtil.setItem(`download_file_key`, fileKey);
          }

          return this.fileService.downloadFile(fileKey);
        })
      )
      .subscribe(
        resp => {
          const contentDisposition = resp.headers.get('content-disposition') || '';
          const matches = /filename=([^;]+)/gi.exec(contentDisposition);
          const filename = ((matches && matches[1]) || 'untitled').trim();

          this.file = <DownloadFile>{
            fileName: filename,
            fileSize: this.formatBytes(resp.body.size).toString()
          };

          downloadData(new Blob(['\ufeff', resp.body]), filename);

          this.spinner.hideSpinner();
        },
        _ => {
          this.spinner.hideSpinner();
          this.isInvalidURL = true;
        }
      );
  }

  goToPortal() {
    const domain = window.location.hostname;
    window.location.href = `https://${domain}`;
  }

  private formatBytes(bytes, decimals = 1) {
    if (bytes === 0) {
      return '0 Bytes';
    }

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
