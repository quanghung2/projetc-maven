import { Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import {
  AuditEventName,
  AuditSearchLogRequest,
  CustomerQuery,
  CustomerService,
  EventNameDescription,
  ModuleDescription
} from '@b3networks/api/audit';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { DestroySubscriberComponent, TimeRangeHelper, TimeRangeKey, X } from '@b3networks/shared/common';
import { combineLatest, Observable } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'poa-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss']
})
export class AuditComponent extends DestroySubscriberComponent implements OnInit {
  timeZone: string;
  auditEventName: AuditEventName[] = [];
  actionOptions: EventNameDescription[];
  moduleFilter: ModuleDescription;
  loading$: Observable<boolean>;
  logs: any[] = [];
  moduleType: string;
  appNameSelected: string;

  configPage = {
    currentPage: 0,
    pageSize: 10,
    totalCount: 0
  };

  constructor(
    private customerService: CustomerService,
    private profileQuery: IdentityProfileQuery,
    private customerQuery: CustomerQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.customerService.getEventName().subscribe();
    this.loading$ = this.customerQuery.loading$;

    combineLatest([this.customerQuery.audits$, this.profileQuery.selectProfileOrg(X.orgUuid)])
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(([audits, org]) => {
        if (org) {
          this.timeZone = org.utcOffset;

          if (audits.length) {
            this.auditEventName = audits;
            this.updateActionOptions();
            this.getAuditLog();
          }
        }
      });
  }

  private updateActionOptions() {
    const ui = this.customerQuery.getUi();
    this.moduleFilter = ui.moduleFilter || this.auditEventName[0].moduleName;
    const audit = this.auditEventName.find(audit => audit.moduleName === this.moduleFilter);
    if (audit) {
      const data: EventNameDescription[] = [...audit.eventName];
      const evenNames = data.sort((a, b) => a.description.localeCompare(b.description));

      this.actionOptions = evenNames;
    }
  }

  onSearchLog() {
    this.updateActionOptions();
    this.configPage.currentPage = 0;
    this.getAuditLog();
  }

  pageChaged(event: PageEvent) {
    this.configPage.currentPage = event.pageIndex;
    this.getAuditLog();
  }

  private getAuditLog() {
    const ui = this.customerQuery.getUi();

    const timeRange = TimeRangeHelper.buildTimeRangeFromKey(ui.lastTimeFilter, this.timeZone);

    if (ui.lastTimeFilter === TimeRangeKey.specific_date) {
      if (!ui.startDate || !ui.endDate) {
        return;
      }

      timeRange.startDate = ui.startDate.toString();
      timeRange.endDate = ui.endDate.toString();
    }

    const { startDate, endDate } = timeRange;

    const request: AuditSearchLogRequest = {
      fromTime: Date.parse(startDate),
      toTime: Date.parse(endDate),
      moduleName: ui.moduleFilter || this.moduleFilter,
      auditName: ui.actionFilter,
      user: ui.userFilter,
      query: ui.queryFilter,
      page: this.configPage.currentPage,
      size: this.configPage.pageSize
    };

    this.customerService
      .searchLog(request)
      .pipe(finalize(() => (this.moduleType = request.moduleName)))
      .subscribe(page => {
        this.logs = page.content;

        this.configPage.totalCount = page.totalCount;
      });
  }
}
