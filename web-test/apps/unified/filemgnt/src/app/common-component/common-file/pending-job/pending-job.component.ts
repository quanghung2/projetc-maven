import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FileQuery, FileService, JobDetailModel, JobInfo, JobResponse } from '@b3networks/api/file';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { catchError, finalize, map, of, switchMap, takeUntil, timer } from 'rxjs';
import { ViewJobDetailComponent } from './view-job-detail/view-job-detail.component';

@Component({
  selector: 'b3n-pending-job',
  templateUrl: './pending-job.component.html',
  styleUrls: ['./pending-job.component.scss']
})
export class PendingJobComponent extends DestroySubscriberComponent implements OnInit {
  displayedColumns: string[] = ['jobId', 'type', 'status', 'actions'];
  currentPendingJobs: JobInfo[];
  jobDetail: JobDetailModel;
  loading: boolean;
  prevPageTitle: string;
  isFolder: boolean;

  constructor(
    private router: Router,
    private fileService: FileService,
    private fileQuery: FileQuery,
    private spinner: LoadingSpinnerSerivce,
    private dialog: MatDialog
  ) {
    super();
  }

  ngOnInit(): void {
    const seconds = 30 * 1000;
    const routerStrings = this.router.url
      .substring(0, this.router.url.lastIndexOf('/'))
      .split('/')
      .filter(item => item);

    this.fileQuery.fileExplorer$.subscribe(res => {
      this.isFolder = res?.isFolder;
      this.prevPageTitle = res?.isFolder ? res?.titleFolder : res?.titleFile || routerStrings[routerStrings.length - 1];
    });

    timer(0, seconds)
      .pipe(
        takeUntil(this.destroySubscriber$),
        switchMap(() => {
          return this.fileService
            .getListJobs({
              orgUuid: X.orgUuid,
              sessionToken: X.sessionToken
            })
            .pipe(
              map((res: JobResponse) =>
                res.jobs.map(item => {
                  return {
                    jobId: item.jobId,
                    type: item.type,
                    status: 'pending'
                  } as JobInfo;
                })
              ),
              catchError(_ => {
                return of(undefined);
              })
            );
        })
      )
      .subscribe(res => {
        this.currentPendingJobs = res;
      });
  }

  onBackPreviousPage() {
    this.router.navigateByUrl(`${this.router.url.substring(0, this.router.url.lastIndexOf('/'))}`);
  }

  onDetail(job: JobInfo) {
    this.getJobById(job, true);
  }

  onRefresh(job: JobInfo) {
    this.loading = true;
    this.getJobById(job);
  }

  private getJobById(job: JobInfo, isDetail?: boolean) {
    this.spinner.showSpinner();
    this.fileService
      .getJobDetailById(job.jobId, {
        orgUuid: X.orgUuid,
        sessionToken: X.sessionToken
      })
      .pipe(
        finalize(() => {
          this.spinner.hideSpinner();
          this.loading = false;
        })
      )
      .subscribe((res: JobDetailModel) => {
        this.jobDetail = res;
        this.jobDetail.jobId = job.jobId;
        isDetail
          ? this.dialog.open(ViewJobDetailComponent, {
              minWidth: '60vw',
              data: this.jobDetail
            })
          : this.currentPendingJobs.forEach(item => {
              if (item.jobId === this.jobDetail?.jobId) {
                item.status = this.jobDetail?.result;
              }
            });
      });
  }
}
