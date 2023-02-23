import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Pageable } from '@b3networks/api/common';
import { LogBulkFiltering, LogService } from '@b3networks/api/dnc';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs';

@Component({
  selector: 'b3n-activity-logs',
  templateUrl: './activity-logs.component.html',
  styleUrls: ['./activity-logs.component.scss']
})
export class ActivityLogsComponent implements OnInit {
  searchTextCtr = new FormControl();
  isLoading: boolean;
  pageable = new Pageable(1, 10);
  totalCount = 0;
  dataSource: MatTableDataSource<LogBulkFiltering> = new MatTableDataSource<LogBulkFiltering>();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  readonly displayedColumns = ['uuid', 'from', 'submit-date', 'total-number', 'cost', 'status', 'actions'];

  constructor(private logService: LogService, private toastService: ToastService) {}

  ngOnInit() {}

  searchPrefix() {
    if (this.searchTextCtr.value) {
      this.isLoading = true;
      this.logService
        .activityLogs(this.searchTextCtr.value)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe(
          data => {
            // this.whiteList = data;
          },
          err => this.toastService.error(err.message)
        );
    }
  }

  onPageChange(event: PageEvent) {
    //   this.pageable.page = event.pageIndex;
    //   this.onFilterChanged();
  }

  download(item: LogBulkFiltering) {
    // if (!item.postback_result) {
    //   return;
    // }
    // this.urlService.download(item.postback_result).subscribe(url => {
    //   download(url, `logs_${item.txn_uuid}`);
    // });
  }

  private updateDataSource(data: LogBulkFiltering[]) {
    this.dataSource = new MatTableDataSource<LogBulkFiltering>(data);
    this.dataSource.paginator = this.paginator;
  }
}
