import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Accessible, AccessibleQuery, AccessibleService, TemplateQuery, TemplateService } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { combineLatest } from 'rxjs';
import { skip, takeUntil } from 'rxjs/operators';
import { UpdateAccessibleComponent } from './update-accessible/update-accessible.component';

@Component({
  selector: 'b3n-accessible',
  templateUrl: './accessible.component.html',
  styleUrls: ['./accessible.component.scss']
})
export class AccessibleComponent extends DestroySubscriberComponent implements OnInit {
  displayColumns = ['accessor', 'code', 'label', 'type', 'showInReportApp', 'action'];
  isLoading: boolean = true;
  dataSource = new MatTableDataSource<Accessible>();
  accessibles: Accessible[];
  search: string = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private accessibleService: AccessibleService,
    private accessibleQuery: AccessibleQuery,
    private templateService: TemplateService,
    private templateQuery: TemplateQuery,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.accessibleService.getAccessibles('*').subscribe();
    this.templateService.getTemplates().subscribe();
    this.search = '*';
    combineLatest([this.accessibleQuery.accessibles$, this.templateQuery.templates$])
      .pipe(skip(1), takeUntil(this.destroySubscriber$))
      .subscribe(
        ([accessibles, template]) => {
          let accesss = cloneDeep(accessibles);
          accesss.forEach(access => {
            let found = template.find(t => t.code === access.code);
            if (found) {
              access.label = found.label;
            }
          });
          this.accessibles = accesss;
          this.filterAccessibles();
          this.isLoading = false;
        },
        error => {
          this.toastService.error(error.message);
          this.isLoading = false;
        }
      );
  }

  refresh() {
    this.isLoading = true;
    this.accessibleService.getAccessibles(this.search).subscribe();
  }

  onSearch() {
    this.accessibleService.getAccessibles(this.search).subscribe();
  }

  filterAccessibles() {
    this.dataSource.data = this.accessibles;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 0);
  }

  onShowUpdateAccessible(accessible?: Accessible) {
    this.dialog.open(UpdateAccessibleComponent, {
      width: '400px',

      data: accessible || null
    });
  }

  confirmDeleteAccess(access?: Accessible) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '50rem',
        data: <ConfirmDialogInput>{
          title: 'Delete Access',
          message: 'Are you sure you want to delete this report access?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteAccess(access);
        }
      });
  }

  deleteAccess(access: Accessible) {
    this.accessibleService.deleteAccess(access).subscribe(
      res => {
        this.toastService.success(' Delete successfully');
      },
      err => {
        this.toastService.error(err.message);
      }
    );
  }
}
