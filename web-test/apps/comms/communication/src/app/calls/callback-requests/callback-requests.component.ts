import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, timer } from 'rxjs';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { filter, finalize, switchMap, take, takeUntil } from 'rxjs/operators';
import { Txn } from '@b3networks/api/callcenter';
import { format, utcToZonedTime } from 'date-fns-tz';
import { subHours } from 'date-fns';
import { GetReportV4Payload, Period, ReportV4Code, V4Service } from '@b3networks/api/data';
import { ActiveIframeService, WindownActiveService } from '@b3networks/api/workspace';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-callback-requests',
  templateUrl: './callback-requests.component.html',
  styleUrls: ['./callback-requests.component.scss']
})
export class CallbackRequestsComponent implements OnInit, OnDestroy {
  private destroyTimer$ = new Subject();

  callLog: Txn[];
  userUtcOffset: string;
  orgUuid: string;
  fetching = true;
  displayedColumns: string[] = [
    'txnUuid',
    'incomingTxnUuid',
    'incomingCallerId',
    'contactNumber',
    'queue',
    'registeredAt',
    'queuedDuration',
    'state'
  ];

  constructor(
    private profileQuery: IdentityProfileQuery,
    private windownActiveService: WindownActiveService,
    private activeIframeService: ActiveIframeService,
    private v4Service: V4Service,
    private toastService: ToastService
  ) {}

  ngOnDestroy(): void {
    this.destroyTimer$.next(true);
    this.destroyTimer$.complete();
  }

  ngOnInit(): void {
    this.profileQuery.currentOrg$
      .pipe(
        filter(org => org != null),
        take(1)
      )
      .subscribe(org => {
        this.userUtcOffset = org.utcOffset;
        this.orgUuid = org.orgUuid;
      });

    this.pollingData();
  }

  pollingData() {
    this.fetching = true;
    this.destroyTimer$.next(true);

    timer(0, 10000)
      .pipe(
        filter(() => this.windownActiveService.windowActiveStatus && this.activeIframeService.isMyIframe),
        takeUntil(this.destroyTimer$),
        switchMap(_ => {
          const req = {
            startTime: format(
              subHours(utcToZonedTime(new Date(), this.userUtcOffset), 12),
              "yyyy-MM-dd'T'HH:mm:ssxxx",
              {
                timeZone: this.userUtcOffset
              }
            ),
            endTime: format(utcToZonedTime(new Date(), this.userUtcOffset), "yyyy-MM-dd'T'HH:mm:ssxxx", {
              timeZone: this.userUtcOffset
            }),
            orgUuid: this.orgUuid
          } as GetReportV4Payload;

          return this.v4Service
            .getReportData(Period['dump'], ReportV4Code.communication.callback, req, null, true)
            .pipe(
              finalize(() => {
                this.fetching = false;
              })
            );
        })
      )
      .subscribe(
        data => {
          if (data) {
            this.callLog = data.rows as Txn[];
          }
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }

  copied() {
    this.toastService.success('Copied to clipboard');
  }
  copyFailed() {
    this.toastService.error('Copy failed');
  }
}
