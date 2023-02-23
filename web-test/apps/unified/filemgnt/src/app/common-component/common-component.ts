import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FileInfo, FileQuery, FileService } from '@b3networks/api/file';
import { donwloadFromUrl, getFilenameFromHeader, X } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { ToastService } from '@b3networks/shared/ui/toast';
import * as _ from 'lodash';
import { finalize, Observable, Subject } from 'rxjs';
import { CursorCaching } from '../common/constants';
import { Pageable } from '@b3networks/api/common';
import { ActionMapping, IamQuery, IAM_GROUP_UUIDS } from '@b3networks/api/auth';

@Component({
  template: ''
})
export class CommonComponent implements OnInit {
  date = new Date();
  nextCursor: string;
  cursorsCaching: CursorCaching[] = [];
  isTrashBin: boolean;
  ui = {
    paging: new Pageable(1, 50),
    currentFiles: <FileInfo[]>[]
  };

  actionMapping$: Observable<ActionMapping>;

  constructor(
    public dialog: MatDialog,
    public spinner: LoadingSpinnerSerivce,
    public fileService: FileService,
    public fileQuery: FileQuery,
    public toastService: ToastService,
    public iamQuery: IamQuery
  ) {}

  ngOnInit(): void {
    this.actionMapping$ = this.iamQuery.selectActionMapping(IAM_GROUP_UUIDS.fileExplorer);
  }

  download(keys: string[]) {
    this.spinner.showSpinner();
    this.fileService
      .downloadFilesZipV3(keys, {
        orgUuid: X.orgUuid,
        sessionToken: X.sessionToken
      })
      .pipe(
        finalize(() => {
          this.spinner.hideSpinner();
        })
      )
      .subscribe(
        res => {
          const downloadFile = new Blob([res.body], { type: `${res.body.type}` });
          const downloadUrl = URL.createObjectURL(downloadFile);
          donwloadFromUrl(downloadUrl, getFilenameFromHeader(res.headers), () => {
            URL.revokeObjectURL(downloadUrl);
          });
        },
        error => {
          this.toastService.error(error?.message || this.getDefaultErrorMessage('download'));
        }
      );
  }

  delete(keys: string[]): Observable<boolean> {
    const subject = new Subject<boolean>();

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '700px',
        data: <ConfirmDialogInput>{
          title: 'Delete File(s)',
          message: `Are you sure you want to move selected folders / files to Trash Bin? <br><br>
          <i>* Files are moved into Trash Bin can be found in Trash Bin item under Action dropdown menu on the toolbar.</i>`,
          confirmLabel: 'Delete',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.spinner.showSpinner();
          this.fileService
            .deleteFilesV3(keys, {
              orgUuid: X.orgUuid,
              sessionToken: X.sessionToken
            })
            .pipe(
              finalize(() => {
                this.spinner.hideSpinner();
              })
            )
            .subscribe(
              () => {
                subject.next(true);
              },
              err => {
                this.toastService.error(err.message || this.getDefaultErrorMessage('delete'));
                subject.next(false);
              }
            );
        }
        subject.next(false);
      });

    return subject.asObservable();
  }

  restore(keys: string[]): Observable<boolean> {
    const subject = new Subject<boolean>();

    this.spinner.showSpinner();
    this.fileService
      .restoreTrashBin(keys, {
        orgUuid: X.orgUuid,
        sessionToken: X.sessionToken
      })
      .pipe(
        finalize(() => {
          this.spinner.hideSpinner();
        })
      )
      .subscribe(
        () => {
          subject.next(true);
        },
        error => {
          this.toastService.error(error.message || this.getDefaultErrorMessage('restore'));
          subject.next(false);
        }
      );

    return subject.asObservable();
  }

  shred(keys: string[]): Observable<boolean> {
    const subject = new Subject<boolean>();
    const textConfirm = 'CONFIRM';

    this.dialog
      .open(ConfirmDialogComponent, {
        width: '700px',
        data: <ConfirmDialogInput>{
          title: 'Shred File(s)',
          message: `This action cannot be undone. Are your sure you want to shred these files permanently? <br><br>
          <i>* Pending shred files will still show up on the trash bin view until the job is completed.</i> <br><br>
          Please type <b>${textConfirm}</b> in the below textbox to confirm the shred file(s) action!`,
          confirmLabel: 'Shred',
          color: 'warn',
          textConfirm: textConfirm
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.spinner.showSpinner();
          this.fileService
            .shredTrashBin(keys, {
              orgUuid: X.orgUuid,
              sessionToken: X.sessionToken
            })
            .pipe(
              finalize(() => {
                this.spinner.hideSpinner();
              })
            )
            .subscribe(
              () => {
                subject.next(true);
              },
              err => {
                this.toastService.error(err.message || this.getDefaultErrorMessage('shred'));
                subject.next(false);
              }
            );
        }
        subject.next(false);
      });

    return subject.asObservable();
  }

  prevPage(): CursorCaching {
    this.ui.paging.page--;

    return _.find(this.cursorsCaching, (item: CursorCaching) => item.pageIndex === this.ui.paging.page);
  }

  nextPage() {
    this.ui.paging.page++;
    if (
      this.ui.paging.page !== 1 &&
      this.nextCursor &&
      !_.map(this.cursorsCaching, item => item.pageIndex).includes(this.ui.paging.page)
    ) {
      this.cursorsCaching.push({
        pageIndex: this.ui.paging.page,
        cursor: this.nextCursor
      });
    }
  }

  private getDefaultErrorMessage(type: string): string {
    return `Cannot ${type} file(s) / folder(s). Please try again later.`;
  }
}
