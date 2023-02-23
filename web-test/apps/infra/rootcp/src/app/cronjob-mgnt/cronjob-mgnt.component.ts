import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Pageable } from '@b3networks/api/common';
import { ChronosService, JobConfig } from '@b3networks/api/cp';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { CloneJobComponent } from './clone-job/clone-job.component';
import { DisableJobComponent } from './disable-job/disable-job.component';
import { EnableJobComponent } from './enable-job/enable-job.component';
import { StoreCronjobComponent } from './store-cronjob/store-cronjob.component';
@Component({
  selector: 'b3n-cronjob-mgnt',
  templateUrl: './cronjob-mgnt.component.html',
  styleUrls: ['./cronjob-mgnt.component.scss']
})
export class CronjobMgntComponent implements OnInit {
  isLoading: boolean = false;
  selectedCategory = 'app-smsmarketing';

  pageable: Pageable = <Pageable>{ page: 1, perPage: 10 };
  totalCount: number = 0;
  dataSource = new MatTableDataSource<JobConfig>();

  categories: string[] = [];

  jobs: JobConfig[] = [];

  displayedColumns: string[] = ['name', 'command', 'lastSuccess', 'lastError', 'interval', 'actions'];

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor(private toastService: ToastService, private dialog: MatDialog, private chronosService: ChronosService) {}

  ngOnInit() {
    this.isLoading = true;
    this.loadData();
  }

  categorySelected(category) {
    this.selectedCategory = category;
    this.chronosService.getJobs(this.selectedCategory).subscribe(jobs => {
      this.dataSource.data = jobs;
    });
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    }, 0);
  }

  refresh() {
    this.isLoading = true;
    this.loadData();
  }

  addNewJob(): void {
    this.dialog
      .open(StoreCronjobComponent, {
        width: '1100px',
        data: this.selectedCategory
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.refresh();
        }
      });
  }

  editJob(element): void {
    this.dialog
      .open(StoreCronjobComponent, {
        width: '1100px',
        data: element
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.refresh();
        }
      });
  }

  runJob(element) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '700px',
        data: <ConfirmDialogInput>{
          title: 'Run job',
          message: 'Are you sure you want to run it manually?',
          confirmLabel: 'Run it. Please!'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.chronosService.runJob(element.category, element.name).subscribe(
            res => {
              this.toastService.success('Run Job Success');
            },
            err => this.toastService.error(err.message)
          );
        }
      });
  }

  enableJob(element) {
    this.dialog
      .open(EnableJobComponent, {
        width: '700px',
        data: element
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.refresh();
        }
      });
  }

  disableJob(element) {
    this.dialog
      .open(DisableJobComponent, {
        width: '700px',
        data: element
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.refresh();
        }
      });
  }

  deleteJob(element) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '700px',
        data: <ConfirmDialogInput>{
          title: 'Delete job',
          message: 'Are you sure you want to delete it manually?',
          confirmLabel: 'Yes, Delete it!',
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.chronosService.deleteJob(element.category, element.name).subscribe(
            res => {
              this.toastService.success('Delete Job Success');
              this.refresh();
            },
            err => {
              this.toastService.error(err.message);
            }
          );
        }
      });
  }

  cloneJob(element) {
    this.dialog
      .open(CloneJobComponent, {
        width: '700px',
        data: element
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.refresh();
        }
      });
  }

  onChangePage(page?: number) {
    if (page > -1) {
      this.pageable.page = 1;
    }
  }

  private loadData() {
    this.chronosService
      .getCategories()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(categories => {
        categories.sort((a, b) => (a > b ? 1 : -1));
        this.categories = categories;
        this.totalCount = categories.length;
        this.isLoading = false;
      });

    this.chronosService
      .getJobs(this.selectedCategory)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe(jobs => {
        jobs.sort((a, b) => (a.name > b.name ? 1 : -1));
        this.jobs = jobs;
        this.dataSource.data = this.jobs;
        setTimeout(() => {
          this.dataSource.paginator = this.paginator;
        }, 0);
        this.isLoading = false;
      });
  }
}
