import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ExtensionBase, ExtensionBLF, ExtensionBLFQuery, ExtensionBLFService } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { debounceTime, finalize, map, takeUntil, tap } from 'rxjs/operators';
import { CreateExtBLFDialogComponent } from './create-ext-blf-dialog/create-ext-blf-dialog.component';
import { UpdateExtBLFDialogComponent } from './update-ext-blf-dialog/update-ext-blf-dialog.component';

@Component({
  selector: 'b3n-busy-lamp-field',
  templateUrl: './busy-lamp-field.component.html',
  styleUrls: ['./busy-lamp-field.component.scss']
})
export class BusyLampFieldComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['monitorExtKey', 'moniteesExtKeys', 'actions'];
  dataSource: MatTableDataSource<ExtensionBLF>;
  loading: boolean;
  searchCtrl = new UntypedFormControl();

  constructor(
    private dialog: MatDialog,
    private extensionBLFService: ExtensionBLFService,
    private extensionBLFQuery: ExtensionBLFQuery,
    private extensionQuery: ExtensionQuery,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.getData();
    this.searchCtrl.valueChanges.pipe(debounceTime(300)).subscribe(number => {
      this.setDatasource(number);
    });
  }

  private getData() {
    this.loading = true;
    this.extensionBLFService
      .getExtBLF()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe(_ => {
        this.setDatasource();
      });
  }

  private setDatasource(key: string = '') {
    this.extensionBLFQuery
      .selectAll({
        filterBy: e => e.monitorExtKey.includes(key),
        sortBy: (a, b) => Number(a.monitorExtKey) - Number(b.monitorExtKey)
      })
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(extensionBLF => {
          this.dataSource = new MatTableDataSource<ExtensionBLF>(extensionBLF);
          this.dataSource.paginator = this.paginator;
        })
      )
      .subscribe();
  }

  refresh() {
    this.getData();
    this.paginator.firstPage();
  }

  customKeyToLabel(keys: string) {
    if (keys) {
      let extListLabel = [];
      let extListSorted = keys.split(',');
      extListSorted.forEach(extKey => {
        this.extensionQuery
          .selectExtension(extKey.trim())
          .pipe(map(ext => ext || new ExtensionBase({ extKey: extKey })))
          .subscribe(res => {
            if (res) {
              extListLabel.push(res.displayText);
            }
          });
      });

      return extListLabel.join(', ');
    } else {
      return 'NA';
    }
  }

  create() {
    this.dialog.open(CreateExtBLFDialogComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false
    });
  }

  edit(e: ExtensionBLF) {
    this.extensionBLFService.setActive(e.monitorExtKey);
    this.dialog.open(UpdateExtBLFDialogComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false
    });
  }

  delete(e: ExtensionBLF) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '500px',
        data: <ConfirmDialogInput>{
          title: 'Delete Extension BLF Group',
          message: `Are you sure you want to delete the extension group <strong>${e.monitorExtKey}</strong>?<br/>Notice that this action can't be undone!`,
          cancelLabel: 'No',
          confirmLabel: 'Yes',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirm => {
        if (confirm) {
          this.extensionBLFService.deleteExtBLF(e.monitorExtKey).subscribe(_ => {
            this.toastr.success(`Delete extension BLF group ${e.monitorExtKey} successfully`);
          });
        }
      });
  }
}
