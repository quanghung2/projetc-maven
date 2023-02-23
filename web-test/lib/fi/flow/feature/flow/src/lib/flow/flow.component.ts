import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrganizationPolicyService } from '@b3networks/api/auth';
import { BuiltInActionDefService, FunctionService, TriggerDefService } from '@b3networks/api/flow';
import { AppConfig, AppName, AppStateQuery, AppStateService } from '@b3networks/fi/flow/shared';
import { X } from '@b3networks/shared/common';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'b3n-flow',
  templateUrl: './flow.component.html',
  styleUrls: ['./flow.component.scss']
})
export class FlowComponent implements OnInit {
  constructor(
    private activatedRoute: ActivatedRoute,
    private organizationPolicyService: OrganizationPolicyService,
    private builtInActionDefService: BuiltInActionDefService,
    private triggerDefService: TriggerDefService,
    private functionService: FunctionService,
    private appStateService: AppStateService,
    private appStateQuery: AppStateQuery
  ) {
    const data = this.activatedRoute.snapshot.data;
    this.appStateService.setAppConfig(<AppConfig>{
      name: data['appName']
    });
  }

  ngOnInit(): void {
    this.builtInActionDefService.getBuiltInActionDefs().subscribe();
    switch (this.appStateQuery.getName()) {
      case AppName.FLOW:
        forkJoin([
          this.triggerDefService.getAllTriggerDef('', ''),
          this.organizationPolicyService.get(X.orgUuid)
        ]).subscribe();
        break;
      case AppName.PROGRAMMABLE_FLOW:
        break;
      case AppName.BUSINESS_ACTION_CREATOR:
        this.functionService.getFunction().subscribe();
        break;
    }
  }
}
