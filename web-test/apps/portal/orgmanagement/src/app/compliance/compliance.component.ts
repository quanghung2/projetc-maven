import { KeyValue } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { IAM_SERVICES, IAM_SIM_ACTIONS, MeIamQuery } from '@b3networks/api/auth';
import { SubscriptionService } from '@b3networks/api/bizphone';
import { FeatureService, LicenseFeatureCode } from '@b3networks/api/license';
import { EventMessageService } from '@b3networks/shared/utils/message';
import { filter } from 'rxjs/operators';
import { RIGHT_SIDEBAR_ID } from '../shared/contants';
import { ComplianceEvent } from './compliance-event';

@Component({
  selector: 'b3n-compliance',
  templateUrl: './compliance.component.html',
  styleUrls: ['./compliance.component.scss']
})
export class ComplianceComponent implements OnInit {
  readonly RIGHT_SETTING_SIDEBAR_ID = RIGHT_SIDEBAR_ID;

  links: KeyValue<string, string>[] = [];

  @ViewChild(MatDrawer) drawer: MatDrawer;

  constructor(
    private eventService: EventMessageService,
    private bzSubService: SubscriptionService,
    private meIamQuery: MeIamQuery,
    private orgFeatureService: FeatureService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  child: any;

  ngOnInit(): void {
    if (this.meIamQuery.hasGrantedAction(IAM_SERVICES.sim, IAM_SIM_ACTIONS.update_number_configuration)) {
      this.links.push({ key: 'msisdn', value: 'MSISDN' });
    }

    this.orgFeatureService.get().subscribe(features => {
      if (features.indexOf(LicenseFeatureCode.dnc) > -1) {
        this.links.push({ key: 'extension', value: 'Extension' });
        this.bzSubService.get().subscribe();
      }

      if (!this.route.firstChild && this.links.length) {
        this.router.navigate([this.links[0].key], { relativeTo: this.route });
      }
    });

    this.eventService.message$.pipe(filter(event => 'showRightSidebar' in event)).subscribe(event => {
      if ((event as ComplianceEvent).showRightSidebar) {
        this.drawer.open();
      } else {
        this.drawer.close();
      }
    });
  }
}
