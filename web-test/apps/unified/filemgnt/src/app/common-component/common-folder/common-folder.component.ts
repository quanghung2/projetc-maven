import { Component, Input, OnInit } from '@angular/core';
import { FileQuery, FileService, FileStore, Folder } from '@b3networks/api/file';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import { ActivatedRoute, Router } from '@angular/router';
import { TRASH_BIN } from '../../common/constants';
import { MatDialog } from '@angular/material/dialog';
import { CommonComponent } from '../common-component';
import * as _ from 'lodash';
import { finalize } from 'rxjs';
import * as moment from 'moment';
import { format } from 'date-fns';
import { SelectionModel } from '@angular/cdk/collections';
import { IamQuery } from '@b3networks/api/auth';

@Component({
  selector: 'b3n-common-folder',
  templateUrl: './common-folder.component.html',
  styleUrls: ['./common-folder.component.scss']
})
export class CommonFolderComponent extends CommonComponent implements OnInit {
  @Input() title: string;
  @Input() type: string;

  folders: Folder[];
  selectionFolders = new SelectionModel<Folder>(true, []);

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
    this.fileQuery.fileExplorer$.subscribe(res => {
      this.date = res?.dateName ? new Date(res.dateName) : this.date;
      this.isTrashBin = res?.isTrashBin;
    });

    this.loadData();
  }

  loadData() {
    this.isTrashBin ? this.loadFolderTrashBin(this.isTrashBin) : this.loadFolderByMonthCurrent();
  }

  toggleAllFolder(isCheckedAll) {
    if (isCheckedAll) {
      this.selectionFolders.clear();
      return;
    }

    this.selectionFolders.select(...this.folders);
  }

  onDownload() {
    super.download(this.mapFoldersKey());
  }

  onDelete() {
    super.delete(this.mapFoldersKey()).subscribe(isSuccess => {
      isSuccess && this.selectionFolders.clear() && this.loadData();
    });
  }

  onRestore() {
    super.restore(this.mapFoldersKey()).subscribe(isSuccess => {
      isSuccess && this.selectionFolders.clear() && this.loadData();
    });
  }

  onShred() {
    super.shred(this.mapFoldersKey()).subscribe(isSuccess => {
      isSuccess && this.selectionFolders.clear() && this.loadData();
    });
  }

  onChangeMonth(dateValue: Date) {
    this.date = dateValue;
    this.loadFolderByMonthCurrent();
    this.selectionFolders.clear();
  }

  onPrevPage() {
    this.selectionFolders.clear();
    this.loadFolderTrashBin(true, super.prevPage()?.cursor);
  }

  onNextPage() {
    this.selectionFolders.clear();
    super.nextPage();
    this.loadFolderTrashBin(true, this.nextCursor);
  }

  onClickFolder(folder: Folder) {
    this.fileStore.updateStateFileExplorer({
      type: this.type,
      titleFolder: this.title,
      isFirstLoad: true,
      isTrashBin: this.isTrashBin
    });
    this.router.navigate([this.isTrashBin ? folder.name + TRASH_BIN : folder.name], { relativeTo: this.route });
  }

  onBack() {
    this.selectionFolders.clear();
    this.fileStore.updateStateFileExplorer({
      isTrashBin: false
    });
    this.isTrashBin = false;
    this.ngOnInit();
  }

  loadFolderTrashBin(isTrashBin: boolean, nextCursor?: string) {
    this.isTrashBin = isTrashBin;
    this.selectionFolders.clear();
    this.spinner.showSpinner();
    this.fileService
      .getListTrashBin(this.type, nextCursor)
      .pipe(
        finalize(() => {
          this.spinner.hideSpinner();
        })
      )
      .subscribe(res => {
        this.folders = res.entries.map(item => {
          return {
            name: item.name.substring(0, item.name.indexOf('/')),
            path: item.fileKey
          };
        });
        this.nextCursor = res.nextCursor;
      });
  }

  onViewPendingJob(link: string) {
    this.fileStore.updateStateFileExplorer({
      titleFolder: this.title,
      isFolder: true
    });
    this.router.navigate([link], { relativeTo: this.route });
  }

  get sortData() {
    return this.folders?.sort((a, b) => {
      return new Date(b.name).getTime() - new Date(a.name).getTime();
    });
  }

  private loadFolderByMonthCurrent() {
    const days = Array.from({ length: moment(this.date).daysInMonth() }, (x, i) =>
      moment(this.date).startOf('month').add(i, 'days')
    );
    const folders = days.map(day => {
      return Object.assign(new Folder(), {
        name: format(new Date(day.toDate()), 'yyyy-MM-dd')
      });
    });

    if (moment(new Date()).month() === moment(this.date).month()) {
      // If It is current month, get current date and dates before
      this.folders = folders.filter(folder =>
        moment(format(new Date(folder.name), 'yyyy-MM-dd')).isSameOrBefore(format(new Date(), 'yyyy-MM-dd'))
      );
    } else {
      this.folders = folders;
    }
  }

  private mapFoldersKey(): string[] {
    return _.map(this.selectionFolders?.selected, (folder: Folder) => {
      return `${this.type}/${folder.name}/`;
    });
  }
}
