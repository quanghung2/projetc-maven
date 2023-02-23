import { Component, OnInit } from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { FlowVersionMapping, ProjectQuery, SimpleAppFlowService, ViewDetailReq } from '@b3networks/api/flow';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { filter, take, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-log',
  templateUrl: './log.component.html',
  styleUrls: ['./log.component.scss']
})
export class LogComponent extends DestroySubscriberComponent implements OnInit {
  readonly tabs = [
    { key: 'programmableFlow', value: 'Programmable Flow' },
    { key: 'webhooks', value: 'Webhooks', hidden: true },
    { key: 'openApiReqs', value: 'Open API Requests' }
  ];
  curTab: string;
  projectUuid: string;
  flowVerMaps: FlowVersionMapping[];
  viewDetailReq: ViewDetailReq;

  constructor(
    private simpleAppService: SimpleAppFlowService,
    private projectQuery: ProjectQuery,
    private profileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit(): void {
    this.curTab = 'programmableFlow';

    this.profileQuery
      .select(state => state.currentOrg)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(profileOrg => !!profileOrg),
        take(1)
      )
      .subscribe(profileOrg => {
        const indexWebhook = this.tabs.findIndex(p => p.key === 'webhooks');
        const indexOpenApiReq = this.tabs.findIndex(p => p.key === 'openApiReqs');
        if (profileOrg.isMember) {
          this.tabs[indexWebhook].hidden = true;
          this.tabs[indexOpenApiReq].hidden = true;
        } else {
          this.tabs[indexWebhook].hidden = false;
          this.tabs[indexOpenApiReq].hidden = true;
        }
      });

    this.projectQuery
      .selectActive(prj => prj.uuid)
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(prjUuid => !!prjUuid),
        take(1)
      )
      .subscribe(prjUuid => {
        this.projectUuid = prjUuid;
        this.simpleAppService.getFlowVersionMapping(this.projectUuid).subscribe(res => {
          this.flowVerMaps = res;
        });
      });
  }
}
