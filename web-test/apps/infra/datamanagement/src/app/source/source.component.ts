import { animate, state, style, transition, trigger } from '@angular/animations';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute } from '@angular/router';
import { Source, SourceQuery, SourceService } from '@b3networks/api/data';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { finalize } from 'rxjs/operators';
import { TestDescriptorComponent } from './test-descriptor/test-descriptor.component';
import { UpdateSourceComponent } from './update-source/update-source.component';

@Component({
  selector: 'b3n-source',
  templateUrl: './source.component.html',
  styleUrls: ['./source.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)'))
    ])
  ]
})
export class SourceComponent extends DestroySubscriberComponent implements OnInit {
  displayColumns = ['descriptor', 'type', 'esIndex', 'iam', 'action'];
  isLoading: boolean = true;
  dataSource = new MatTableDataSource<Source>();
  sources: Source[];
  sourceFiltered: Source[];
  expandedElement: string = null;
  search: string = null;

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(
    private sourceService: SourceService,
    private sourceQuery: SourceQuery,
    private activatedRoute: ActivatedRoute,
    private dialog: MatDialog,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoading = true;

    this.sourceService.getSources().subscribe();
    this.sourceQuery.source$.pipe(finalize(() => (this.isLoading = false))).subscribe(
      source => {
        this.sources = source;
        if (source.length > 0) {
          this.search = this.activatedRoute.snapshot.paramMap.get('descriptor');
          this.filterSources();
          this.expandElement(this.search);
        }
        this.isLoading = false;
      },
      err => {
        this.isLoading = false;
        this.toastService.error(err.message);
      }
    );
  }

  refesh() {
    this.isLoading = true;
    this.sourceService.getSources().subscribe();
  }

  onShowUpdateSource(event?, source?: Source) {
    if (event) {
      event.stopPropagation();
    }

    this.dialog.open(UpdateSourceComponent, {
      width: '450px',
      data: source || null
    });
  }

  onShowTestDescriptor(event?, source?: Source) {
    if (event) {
      event.stopPropagation();
    }

    this.dialog.open(TestDescriptorComponent, {
      width: '1200px',
      data: source || null
    });
  }

  filterSources() {
    this.sourceFiltered = cloneDeep(this.sources);
    if (this.search) {
      this.sourceFiltered = this.sourceFiltered.filter(source => source.descriptor?.indexOf(this.search.trim()) !== -1);
    }
    this.dataSource.data = this.sourceFiltered;
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 0);
  }

  expandElement(descriptor: string) {
    if (descriptor) {
      if (this.sourceFiltered && this.sourceFiltered.length > 0) {
        let found = this.sourceFiltered.find(s => s.descriptor == descriptor);
        if (found) {
          this.expandedElement = found.id;
        }
      }
    }
  }

  trackTask(index: number, item: Source): string {
    return `${item.id}`;
  }

  confirmDeleteSource(event?, source?: Source) {
    if (event) {
      event.stopPropagation();
    }
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '50rem',
        data: <ConfirmDialogInput>{
          title: 'Delete Source',
          message: 'Are you sure you want to delete this report source?',
          cancelLabel: 'No',
          confirmLabel: 'Yes'
        },
        disableClose: true
      })
      .afterClosed()
      .subscribe(res => {
        if (res) {
          this.deleteSource(source);
        }
      });
  }

  deleteSource(source: Source) {
    this.sourceService.deleteSource(source).subscribe(
      res => {
        this.toastService.success(' Delete successfully');
      },
      err => {
        this.toastService.error(err.message);
      }
    );
  }
}
