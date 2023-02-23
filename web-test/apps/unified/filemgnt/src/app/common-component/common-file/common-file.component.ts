import * as _ from 'lodash';
import { Component, OnInit } from '@angular/core';
import { FileEntry, FileInfo, FileQuery, FileService, FileStore } from '@b3networks/api/file';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { FILE_TYPE, TITLE, TRASH_BIN } from '../../common/constants';
import { CommonComponent } from '../common-component';
import { finalize } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';
import { IamQuery } from '@b3networks/api/auth';

@Component({
  selector: 'b3n-common-file',
  templateUrl: './common-file.component.html',
  styleUrls: ['./common-file.component.scss']
})
export class CommonFileComponent extends CommonComponent implements OnInit {
  displayedColumns: string[] = ['select', 'name', 'size', 'last_modified'];
  type: string;
  title: string;
  titlePrevPage: string;
  isFirstLoad: boolean;
  selectionFiles = new SelectionModel<FileInfo>(true, []);

  constructor(
    private fileStore: FileStore,
    private router: Router,
    private route: ActivatedRoute,
    public override dialog: MatDialog,
    public override spinner: LoadingSpinnerSerivce,
    public override fileService: FileService,
    public override fileQuery: FileQuery,
    public override toastService: ToastService,
    public override iamQuery: IamQuery
  ) {
    super(dialog, spinner, fileService, fileQuery, toastService, iamQuery);
  }

  override ngOnInit(): void {
    super.ngOnInit();

    let dateValue: string;
    const stringValue = this.router.url.substring(this.router.url.lastIndexOf('/') + 1, this.router.url.length);
    const typeValue = this.router.url.substring(0, this.router.url.lastIndexOf('/'));

    this.isTrashBin = stringValue.includes(TRASH_BIN);
    if (this.isTrashBin) {
      dateValue = stringValue.substring(0, stringValue.indexOf(TRASH_BIN));
    } else {
      dateValue = stringValue;
    }

    this.title = dateValue || format(this.date, 'yyyy-MM-dd');
    this.date = dateValue ? new Date(dateValue) : this.date;
    this.fileQuery.fileExplorer$.subscribe(res => {
      this.type = res?.type || typeValue.substring(typeValue.lastIndexOf('/') + 1, typeValue.length);
      this.titlePrevPage = res?.titleFolder || this.type === FILE_TYPE.recordings ? TITLE.recordings : TITLE.voicemails;
      if (!_.isNil(res?.isFirstLoad)) {
        this.isFirstLoad = res.isFirstLoad;
      }
    });
    this.loadData(this.isTrashBin);
  }

  loadData(isTrashBin: boolean) {
    isTrashBin ? this.loadFilesTrashBin() : this.loadFilesData();
  }

  isAllSelected(): boolean {
    const numSelected = this.selectionFiles.selected?.length;
    const numRows = this.ui.currentFiles?.length;
    return numSelected === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selectionFiles.clear();
      return;
    }

    this.selectionFiles.select(...this.ui.currentFiles);
  }

  onDownload() {
    super.download(this.mapFilesKey());
  }

  onDelete() {
    super.delete(this.mapFilesKey()).subscribe(isSuccess => {
      isSuccess && this.selectionFiles.clear() && this.loadData(this.isTrashBin);
    });
  }

  onRestore() {
    super.restore(this.mapFilesKey()).subscribe(isSuccess => {
      isSuccess && this.selectionFiles.clear() && this.loadData(this.isTrashBin);
    });
  }

  onShred() {
    super.shred(this.mapFilesKey()).subscribe(isSuccess => {
      isSuccess && this.selectionFiles.clear() && this.loadData(this.isTrashBin);
    });
  }

  onChangeDate(date: Date) {
    this.date = date;
    this.title = format(date, 'yyyy-MM-dd');
    this.router.navigateByUrl(`${this.type}/${this.title}`);
    this.loadFilesData(null, true);
    this.selectionFiles.clear();
  }

  onPrevPage() {
    this.selectionFiles.clear();
    this.loadFilesData(super.prevPage()?.cursor, true);
  }

  onNextPage() {
    this.selectionFiles.clear();
    super.nextPage();
    this.loadFilesData(this.nextCursor, true);
  }

  onBackPreviousPage() {
    this.fileStore.updateStateFileExplorer({
      dateName: this.isTrashBin ? null : this.title,
      type: this.type,
      isFirstLoad: false,
      isTrashBin: this.isTrashBin
    });
    this.router.navigateByUrl(this.type);
  }

  viewFolderTrashBin(isTrashBin: boolean) {
    this.fileStore.updateStateFileExplorer({
      isTrashBin: isTrashBin
    });
    this.router.navigateByUrl(this.type);
  }

  onViewPendingJob(link: string) {
    this.fileStore.updateStateFileExplorer({
      titleFile: this.title,
      isFolder: false
    });
    this.router.navigate([link], { relativeTo: this.route });
  }

  private loadFilesData(nextCursor?: string, isActionChange?: boolean) {
    nextCursor = this.handleStateManagementFileType(nextCursor, isActionChange);

    this.spinner.showSpinner();
    this.fileService
      .getFilesV3(format(new Date(this.date), 'yyyy-MM-dd'), this.type, nextCursor)
      .pipe(
        finalize(() => {
          this.spinner.hideSpinner();
        })
      )
      .subscribe(res => {
        this.ui.currentFiles = this.mapFiles(res.entries);
        this.nextCursor = res.nextCursor;
      });
  }

  private loadFilesTrashBin() {
    const prefix = `${this.type}/${format(this.date, 'yyyy-MM-dd')}`;

    this.selectionFiles.clear();
    this.spinner.showSpinner();
    this.fileService
      .getListTrashBin(prefix, this.nextCursor)
      .pipe(
        finalize(() => {
          this.spinner.hideSpinner();
        })
      )
      .subscribe(res => {
        this.ui.currentFiles = this.mapFiles(res.entries);
        this.nextCursor = res.nextCursor;
      });
  }

  private handleStateManagementFileType(nextCursor: string, isActionChange: boolean): string {
    if (this.type === FILE_TYPE.recordings) {
      this.fileQuery.fileExplorer$.subscribe(res => {
        if (this.isFirstLoad) {
          return;
        }
        if (res?.nextCursorRecording) {
          nextCursor = res.nextCursorRecording;
        }
        if (!isActionChange && res?.dateRecording) {
          this.date = new Date(res.dateRecording);
        }
      });
    }

    if (this.type === FILE_TYPE.voicemails) {
      this.fileQuery.fileExplorer$.subscribe(res => {
        if (this.isFirstLoad) {
          return;
        }
        if (res?.nextCursorVoicemail) {
          nextCursor = res.nextCursorVoicemail;
        }
        if (!isActionChange && res?.dateVoicemail) {
          this.date = new Date(res.dateVoicemail);
        }
      });
    }

    return nextCursor;
  }

  private mapFilesKey(): string[] {
    return _.map(this.selectionFiles?.selected, (file: FileInfo) => file.key);
  }

  private mapFiles(entries: FileEntry[]): FileInfo[] {
    if (entries.length === 0) {
      return [];
    }

    return _.map(entries, entry =>
      Object.assign(new FileInfo(), {
        last_modified: entry.lastModified,
        key: entry.fileKey,
        name: entry.name,
        size: entry.size
      })
    );
  }
}
