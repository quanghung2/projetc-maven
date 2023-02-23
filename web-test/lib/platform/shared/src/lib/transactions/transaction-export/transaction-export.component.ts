import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { GetReportV4Payload, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import { downloadData, getFilenameFromHeader, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { addDays, startOfDay, subDays } from 'date-fns';
import { format, utcToZonedTime } from 'date-fns-tz';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-transaction-export',
  templateUrl: './transaction-export.component.html',
  styleUrls: ['./transaction-export.component.scss']
})
export class TransactionExportComponent implements OnInit {
  minStart = subDays(new Date(), 100);
  maxStart = new Date();
  minEnd = subDays(new Date(), 100);
  maxEnd = new Date();
  timeRangeExport = { start: null, end: null };
  exporting = false;
  timezone: string;
  buyerUuid: string;
  sellerUuid: string;
  currency: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public balance,
    public router: Router,
    private toastService: ToastService,
    private v4Service: V4Service,
    public dialogRef: MatDialogRef<TransactionExportComponent>,
    private identityProfileQuery: IdentityProfileQuery
  ) {
    this.buyerUuid = balance.buyerUuid;
    this.sellerUuid = balance.sellerUuid;
    this.currency = balance.currency || '';
    this.timeRangeExport.start = new Date(balance.selectedDate);
    this.timeRangeExport.end = new Date(balance.selectedDate);
  }

  ngOnInit() {
    this.identityProfileQuery.currentOrg$.subscribe(org => {
      this.timezone = org?.utcOffset;
    });
  }

  export() {
    this.exporting = true;
    if (this.buyerUuid) {
      this.v4Service
        .downloadReport2(
          Period['1d'],
          ReportV4Code.sellerGroupedBill,
          <GetReportV4Payload>{
            startTime: format(
              startOfDay(
                utcToZonedTime(this.timeRangeExport.start ? this.timeRangeExport.start : new Date(), this.timezone)
              ),
              "yyyy-MM-dd'T'HH:mm:ssxxx",
              {
                timeZone: this.timezone
              }
            ),
            endTime: format(
              addDays(
                startOfDay(
                  utcToZonedTime(this.timeRangeExport.end ? this.timeRangeExport.end : new Date(), this.timezone)
                ),
                1
              ),
              "yyyy-MM-dd'T'HH:mm:ssxxx",
              {
                timeZone: this.timezone
              }
            ),
            queryString: this.buyerUuid
          },
          {
            orgUuid: X.orgUuid,
            sessionToken: X.sessionToken
          }
        )
        .pipe(finalize(() => (this.exporting = false)))
        .subscribe(
          response => {
            downloadData(
              new Blob([response.body], { type: 'text/csv;charset=utf-8;' }),
              getFilenameFromHeader(response.headers)
            );
            this.dialogRef.close();
          },
          error => {
            this.toastService.error(error.message || 'Cannot export transactions. Please try again later.');
          }
        );
    } else {
      this.v4Service
        .downloadReport2(
          Period['1d'],
          ReportV4Code.billingBuyerBalanceMovement,
          <GetReportV4Payload>{
            startTime: format(
              startOfDay(
                utcToZonedTime(this.timeRangeExport.start ? this.timeRangeExport.start : new Date(), this.timezone)
              ),
              "yyyy-MM-dd'T'HH:mm:ssxxx",
              {
                timeZone: this.timezone
              }
            ),
            endTime: format(
              addDays(
                startOfDay(
                  utcToZonedTime(this.timeRangeExport.end ? this.timeRangeExport.end : new Date(), this.timezone)
                ),
                1
              ),
              "yyyy-MM-dd'T'HH:mm:ssxxx",
              {
                timeZone: this.timezone
              }
            ),
            filter: {
              seller: this.sellerUuid,
              currency: this.currency
            }
          },
          {
            orgUuid: X.orgUuid,
            sessionToken: X.sessionToken
          }
        )
        .pipe(finalize(() => (this.exporting = false)))
        .subscribe(
          response => {
            downloadData(
              new Blob([response.body], { type: 'text/csv;charset=utf-8;' }),
              getFilenameFromHeader(response.headers)
            );
            this.dialogRef.close();
          },
          error => {
            this.toastService.error(error.message || 'Cannot export transactions. Please try again later.');
          }
        );
    }
  }

  startDateChanged(value) {
    this.minEnd = new Date(value);
  }

  endDateChanged(value) {
    this.maxStart = new Date(value);
  }
}
