import { Component, OnInit } from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { Extension, IncomingAction, MailBoxAction } from '@b3networks/api/bizphone';
import {
  AgentService,
  AgentStatus,
  AssignedNumber,
  AssignedNumberStatus,
  ExtensionQuery,
  Me,
  NumberService,
  ScheduleService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { combineLatest, of } from 'rxjs';
import { catchError, distinctUntilKeyChanged, filter, mergeMap, takeUntil } from 'rxjs/operators';

export interface OverviewData {
  status: 'officeHour' | 'nonOfficeHour' | 'publicHoliday' | null;
  extension: Extension;
  assignedNumbers: AssignedNumber[];
  agent: Me;
  incomingCallAction: IncomingAction;
}

@Component({
  selector: 'b3n-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent extends DestroySubscriberComponent implements OnInit {
  readonly AgentStatus = AgentStatus;
  readonly AssignedNumberStatus = AssignedNumberStatus;

  data: OverviewData;
  isLoading: boolean;

  constructor(
    private identityQuery: IdentityProfileQuery,
    private extensionQuery: ExtensionQuery,
    private scheduleService: ScheduleService,
    private numberService: NumberService,
    private agentService: AgentService
  ) {
    super();
  }

  ngOnInit(): void {
    this.isLoading = true;
    combineLatest([
      this.extensionQuery.selectActive().pipe(
        filter(extension => !!extension),
        distinctUntilKeyChanged('extKey')
      ),
      this.identityQuery.currentOrg$
    ])
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(([ext, org]) => ext != null && org != null),
        mergeMap(([extension]) => {
          this.scheduleService.getSchedule(extension.identityUuid).subscribe();
          return combineLatest([
            this.extensionQuery.selectExtension(extension.extKey),
            this.numberService.getAssignedNumbersByExtKeyV4(extension.extKey),
            this.agentService.getAgentByIdentityUuid(extension.identityUuid),
            this.scheduleService.getScheduleStatusByExtKey(extension.extKey).pipe(catchError(_ => of(null)))
          ]);
        }),
        catchError(_ => of([]))
      )
      .subscribe(([extension, assignedNumbers, agent, schedule]) => {
        const status = schedule?.status;
        this.data = {
          extension: extension,
          agent: agent,
          assignedNumbers: assignedNumbers,
          status: status,
          incomingCallAction: this.findAction(extension, status, agent)
        } as OverviewData;
        this.isLoading = false;
      });
  }

  private findAction(
    extension: Extension,
    workStatus: 'officeHour' | 'nonOfficeHour' | 'publicHoliday',
    agent: Me
  ): IncomingAction | MailBoxAction {
    if (workStatus !== 'officeHour') {
      return extension.mailBox?.[workStatus === 'nonOfficeHour' ? 'nonOfficeHours' : workStatus]?.action;
    }
    return extension.mailBox?.[agent.status]?.action || extension.incomingAction;
  }
}
