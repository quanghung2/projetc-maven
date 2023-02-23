import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { ActivatedRoute } from '@angular/router';
import { FileInfo, FileInfoResponse, FileService } from '@b3networks/api/file';
import { donwloadFromUrl, getFilenameFromHeader } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { Subject } from 'rxjs';
import { finalize, mergeMap, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-file-list',
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss']
})
export class FileListComponent implements OnInit, OnDestroy {
  folderPath: string;
  breadcrumbs: Breadcrumb[] = [];

  data: FileInfoResponse = new FileInfoResponse();
  pageSize = 1000;

  loading: boolean;
  reloading: boolean;
  downloadingSelected: boolean;

  displayedColumns: string[] = ['selection', 'filename', 'size', 'created', 'actions'];

  stopPollingSub = new Subject();

  get hasNoSelectedFiles() {
    if (!this.data || this.data.result.length === 0) {
      return true;
    }
    return !this.data.result.find(f => f['selected']);
  }

  get isSelectAll() {
    return this.data && this.data.result.every(f => f['selected']);
  }

  get isIndeterminate() {
    return !this.isSelectAll && this.data.result.find(f => f['selected']);
  }

  get countOfSelected() {
    return this.data.result.filter(f => f['selected']).length;
  }

  constructor(
    private fileService: FileService,
    private route: ActivatedRoute,
    private spinnerService: LoadingSpinnerSerivce
  ) {}

  ngOnInit() {
    this.loading = true;
    this.route.params
      .pipe(
        mergeMap(data => {
          this.folderPath = data['path'];
          this.buildBreadcrumbs(data['path']);
          return this.fileService.queryFiles(data['path'], this.data.next_token, this.pageSize);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe(data => {
        this.data = data;
        this.loading = false;
        this.spinnerService.hideSpinner();

        if (data.next_token) {
          this.pollingFiles();
        }
      });
  }

  ngOnDestroy() {
    if (this.stopPollingSub) {
      this.stopPollingSub.next(true);
    }
  }

  pollingFiles() {
    if (!this.data.next_token) {
      return;
    }
    this.fileService
      .queryFiles(this.folderPath, this.data.next_token, this.pageSize)
      .pipe(takeUntil(this.stopPollingSub))
      .subscribe(data => {
        this.data.files = this.data.files.concat(data.files);
        this.data.folders = this.data.folders.concat(data.folders);
        this.data.next_token = data.next_token;
        if (data.next_token) {
          this.pollingFiles();
        }
      });
  }

  buildBreadcrumbs(path: string) {
    this.breadcrumbs = [];
    if (path && path.trim().length > 0) {
      const paths = path.split('/');
      paths.forEach((value, index) => {
        index > 0;
        this.breadcrumbs.push({
          title: value,
          path: index > 0 ? this.breadcrumbs[index - 1].path + '/' + value : value
        });
      });
    }
  }

  reload() {
    this.reloading = true;

    this.stopPollingSub.next(true); // cancel polling first

    this.fileService
      .queryFiles(this.folderPath, '', this.pageSize)
      .pipe(
        finalize(() => {
          this.reloading = false;
        })
      )
      .subscribe(response => {
        this.data = response;
        if (this.data.next_token) {
          this.pollingFiles();
        }
      });
  }

  toggleAll(changed: MatCheckboxChange) {
    if (!changed.checked) {
      this.data.result.forEach(f => (f['selected'] = false));
    } else {
      this.data.result.forEach(f => (f['selected'] = true));
    }
  }

  downloadSelected() {
    this.downloadingSelected = true;
    const selectedFiles = this.data.files.filter(f => f['selected']);
    const selectedFolders = this.data.folders.filter(f => f['selected']);
    this.fileService
      .zip2Download(selectedFiles, selectedFolders)
      .pipe(
        finalize(() => {
          this.downloadingSelected = false;
        })
      )
      .subscribe(response => {
        const file = new Blob([response], { type: 'application/zip' });
        const fileURL = window.URL.createObjectURL(file);
        donwloadFromUrl(fileURL, 'download.zip', () => {
          URL.revokeObjectURL(fileURL);
        });
      });
  }

  downloadFile(file: FileInfo) {
    file['downloading'] = true;

    this.fileService
      .downloadFileV3(file.key.slice(37))
      .pipe(finalize(() => (file['downloading'] = false)))
      .subscribe(res => {
        const downloadFile = new Blob([res.body], { type: `${res.body.type}` });
        const downloadUrl = URL.createObjectURL(downloadFile);
        donwloadFromUrl(downloadUrl, getFilenameFromHeader(res.headers), () => {
          URL.revokeObjectURL(downloadUrl);
        });
      });
  }
}

export interface Breadcrumb {
  title: string;
  path: string;
}
