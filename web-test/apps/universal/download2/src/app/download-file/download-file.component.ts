import { HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { IdentityProfileService } from '@b3networks/api/auth';
import { FileService } from '@b3networks/api/file';
import { buildUrlParameter, DomainUtilsService, downloadData, X_B3_HEADER } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { lastValueFrom, switchMap } from 'rxjs';

export interface DownloadFile {
  fileName: string;
  fileSize: string;
  cookieMap: { [Tkey in string]: string };
}

@Component({
  selector: 'b3n-download-file',
  templateUrl: './download-file.component.html',
  styleUrls: ['./download-file.component.scss']
})
export class DownloadFileComponent implements OnInit {
  file: DownloadFile;
  downloaded: boolean;

  isInvalidURL: boolean;
  isInvalidOrgUuid: boolean;
  unauthentiated: boolean;

  constructor(
    private spinner: LoadingSpinnerSerivce,
    private profileSerivce: IdentityProfileService,
    private fileService: FileService,
    private domainUtilsService: DomainUtilsService
  ) {}

  async ngOnInit(): Promise<void> {
    this.downloaded = false;
    this.isInvalidURL = false;
    this.isInvalidOrgUuid = false;
    this.file = null;

    const s3Key = location.hash.substring('#/'.length, location.hash.indexOf('?'));

    if (!s3Key) {
      this.isInvalidURL = true;
    }

    this.spinner.showSpinner();

    const params = buildUrlParameter() as { orgUuid };

    const orgs = await lastValueFrom(this.profileSerivce.getAllBelongOrgs(), { defaultValue: [] });
    const validOrg = orgs.find(o => o.orgUuid === params.orgUuid);
    if (!validOrg) {
      this.isInvalidOrgUuid = true;
      this.spinner.hideSpinner();
      return;
    }

    this.fileService
      .getFileInfo(s3Key, new HttpHeaders().set(X_B3_HEADER.orgUuid, params.orgUuid))
      .pipe(
        switchMap(() =>
          this.fileService.downloadFileV3(s3Key, null, new HttpHeaders().set(X_B3_HEADER.orgUuid, params.orgUuid))
        )
      )
      .subscribe({
        next: resp => {
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
        error: error => {
          console.log(error);
          this.spinner.hideSpinner();
          if (error.sec !== 201) {
            this.isInvalidURL = true;
          } else {
            this.unauthentiated = true;
          }
        },
        complete: console.log
      });
  }

  goToPortal() {
    window.location.href = `https://${this.domainUtilsService.getPortalDomain()}`;
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
