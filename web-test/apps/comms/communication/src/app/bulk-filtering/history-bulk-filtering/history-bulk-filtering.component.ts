import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { BulkFilterQuery, BulkFilterService, JobBulkFilter } from '@b3networks/api/dnc';
import { DestroySubscriberComponent, downloadData } from '@b3networks/shared/common';
import { finalize, takeUntil } from 'rxjs';

@Component({
  selector: 'b3n-history-bulk-filtering',
  templateUrl: './history-bulk-filtering.component.html',
  styleUrls: ['./history-bulk-filtering.component.scss']
})
export class HistoryBulkFilteringComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;

  dataSource: MatTableDataSource<JobBulkFilter> = new MatTableDataSource<JobBulkFilter>();
  totalCount = 0;
  loadingDownload: boolean;

  readonly displayedColumns = ['uuid', 'email', 'createdAt', 'total-number', 'charged', 'status', 'actions'];

  constructor(
    private bulkFilterQuery: BulkFilterQuery,
    private bulkFilterService: BulkFilterService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit() {
    this.bulkFilterService.getAllJobCreated().subscribe();

    this.bulkFilterQuery.selectAll$.pipe(takeUntil(this.destroySubscriber$)).subscribe(list => {
      this.updateDataSource(list);
    });
  }

  download(job: JobBulkFilter) {
    this.loadingDownload = true;
    this.bulkFilterService
      .getResultBulkFilter(job?.bulkUuid)
      .pipe(finalize(() => (this.loadingDownload = false)))
      .subscribe(resp => {
        const file = new Blob([resp.body], { type: `${resp.body.type}` });
        downloadData(file, `Bulk_Filtering_Result_${new Date().getTime()}`);
      });
  }

  private updateDataSource(items: JobBulkFilter[]) {
    this.dataSource = new MatTableDataSource<JobBulkFilter>(items);
    this.dataSource.paginator = this.paginator;
    this.cdr.detectChanges();
  }
}
