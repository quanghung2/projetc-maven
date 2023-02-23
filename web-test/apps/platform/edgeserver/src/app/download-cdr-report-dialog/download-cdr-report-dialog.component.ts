import { HttpEventType } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { GetReportV4Payload, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import { downloadData, getFilenameFromHeader, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { startOfDay, subMonths } from 'date-fns';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-download-cdr-report-dialog',
  templateUrl: './download-cdr-report-dialog.component.html',
  styleUrls: ['./download-cdr-report-dialog.component.scss']
})
export class DownloadCdrReportDialogComponent implements OnInit {
  fromTimeCtrl = new UntypedFormControl(startOfDay(subMonths(new Date().setDate(1), 1)), Validators.required);
  toTimeCtrl = new UntypedFormControl(new Date(), Validators.required);

  maxStart = new Date();
  minEnd = startOfDay(subMonths(new Date().setDate(1), 1));
  maxEnd = new Date();

  downloading: boolean;
  percentage = 0;

  constructor(
    private dialogRef: MatDialogRef<DownloadCdrReportDialogComponent>,
    private v4Service: V4Service,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  fromDateChange() {
    this.minEnd = new Date(this.fromTimeCtrl.value);
  }

  toDateChange() {
    this.maxStart = new Date(this.toTimeCtrl.value);
  }

  download() {
    const startTime = <Date>this.fromTimeCtrl.value;
    const endTime = <Date>this.toTimeCtrl.value;
    this.downloading = true;
    this.v4Service
      .downloadReportWithProgress(
        Period.dump,
        ReportV4Code.edge.leg,
        <GetReportV4Payload>{
          startTime: new Date(startTime.getTime() - startTime.getTimezoneOffset() * 60000).toISOString(),
          endTime: new Date(endTime.getTime() - endTime.getTimezoneOffset() * 60000).toISOString(),
          period: null
        },
        { orgUuid: X.orgUuid, sessionToken: X.sessionToken }
      )
      .pipe(finalize(() => (this.downloading = false)))
      .subscribe(
        event => {
          // console.log(event);
          switch (event.type) {
            case HttpEventType.Sent:
              this.percentage = 0;
              break;
            case HttpEventType.UploadProgress:
              this.percentage = 10;
              break;
            case HttpEventType.DownloadProgress:
              if (event.total) {
                this.percentage = Math.round((100 * event.loaded) / event.total);
              } else {
                this.percentage = 91;
              }
              break;
            case HttpEventType.Response:
              this.percentage = 100;
              downloadData(
                new Blob([event.body], { type: 'text/csv;charset=utf-8;' }),
                getFilenameFromHeader(event.headers)
              );
              this.dialogRef.close();
              break;
          }
        },
        err => this.toastService.error(err.message)
      );
  }
}
