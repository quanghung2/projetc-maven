import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { ExtensionBase } from '@b3networks/api/bizphone';
import {
  ExtensionGroup,
  ExtensionGroupService,
  EXTENSIONGROUP_PAGINATOR,
  ExtensionQuery
} from '@b3networks/api/callcenter';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { PaginationResponse, PaginatorPlugin } from '@datorama/akita';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { UpdateExtensionGroup, UpdateExtGroupComponent } from './update-ext-group/update-ext-group.component';

@Component({
  selector: 'b3n-ext-group',
  templateUrl: './ext-group.component.html',
  styleUrls: ['./ext-group.component.scss']
})
export class ExtGroupComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  displayedColumns = ['extKey', 'extLabel', 'extList', 'actions'];
  extensionGroup$: Observable<PaginationResponse<ExtensionGroup>>;
  searchCtrl = new UntypedFormControl();

  constructor(
    @Inject(EXTENSIONGROUP_PAGINATOR) public paginatorRef: PaginatorPlugin<ExtensionGroup>,
    private dialog: MatDialog,
    private extensionGroupService: ExtensionGroupService,
    private extensionQuery: ExtensionQuery,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.extensionGroup$ = <Observable<PaginationResponse<ExtensionGroup>>>this.paginatorRef.pageChanges.pipe(
      switchMap(page => {
        const reqFn = () =>
          this.extensionGroupService.getListExtensionGroup({ keyword: this.searchCtrl.value }, { page, perPage: 10 });
        return this.paginatorRef.getPage(reqFn);
      })
    );

    this.searchCtrl.valueChanges.pipe(debounceTime(300), startWith('')).subscribe(_ => {
      this.paginatorRef.clearCache();
      this.paginatorRef.setPage(0);
      this.paginator?.firstPage();
    });
  }

  ngOnDestroy(): void {
    this.paginatorRef.destroy();
  }

  refresh() {
    this.paginatorRef.clearCache();
    this.paginatorRef.refreshCurrentPage();
  }

  changePage(page?: number) {
    this.paginatorRef.setPage(page);
  }

  saveOrUpdate(e?: ExtensionGroup) {
    this.dialog
      .open(UpdateExtGroupComponent, {
        width: '500px',
        disableClose: true,
        autoFocus: false,
        data: <UpdateExtensionGroup>{
          extensionGroup: e
        }
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.refresh();
        }
      });
  }

  deleteCallGroup(e: ExtensionGroup) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '700px',
        data: <ConfirmDialogInput>{
          title: 'Delete call group',
          message: 'Are you sure you want to delete call group?',
          confirmLabel: 'Delete',
          color: 'warn'
        },
        disableClose: true,
        autoFocus: false
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.extensionGroupService.delete(e).subscribe(
            _ => {
              this.toastService.success('Delete call group successfully');
              this.refresh();
            },
            error => {
              this.toastService.error(error.message);
            }
          );
        }
      });
  }

  customKeyToLabel(keys: string) {
    if (keys) {
      const extListLabel = [];
      const extListSorted = keys.split(',');
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
}
