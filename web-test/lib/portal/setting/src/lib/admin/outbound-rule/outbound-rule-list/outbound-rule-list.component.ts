import { Location } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { IdentityProfile, IdentityProfileQuery, OrgLinkService } from '@b3networks/api/auth';
import { OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';

import { filter, finalize, takeUntil, tap } from 'rxjs/operators';
import {
  InputUpdateOutboundRule,
  OutboundRuleDetailComponent
} from '../../../shared/outbound-rule-detail/outbound-rule-detail.component';
import { CreateComponent } from '../create/create.component';

export interface InputStoreOutboundRule {
  isCreate: boolean;
  id: number;
  name: string;
}

@Component({
  selector: 'b3n-outbound-rule-list',
  templateUrl: './outbound-rule-list.component.html',
  styleUrls: ['./outbound-rule-list.component.scss']
})
export class OutboundRuleListComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  displayedColumns = ['name', 'actions'];
  fetching: boolean;
  dataSource = new MatTableDataSource<OutboundRule>();
  profile: IdentityProfile;
  defaultRule: OutboundRule;

  constructor(
    private outboundRuleService: OutboundRuleService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private location: Location,
    private orgLinkService: OrgLinkService,
    private identityProfileQuery: IdentityProfileQuery
  ) {
    super();
  }

  ngOnInit() {
    this.fetchOutboundRules();
    this.identityProfileQuery.profile$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(profile => !!profile),
        tap(profile => {
          this.profile = profile;
          this.orgLinkService.getGroups(profile.uuid).subscribe();
        })
      )
      .subscribe();

    this.outboundRuleService.getDefaultOrgOutboundRule().subscribe(rule => (this.defaultRule = rule));
  }

  fetchOutboundRules() {
    this.fetching = true;
    this.outboundRuleService
      .getOutboundRules()
      .pipe(takeUntil(this.destroySubscriber$))
      .pipe(finalize(() => (this.fetching = false)))
      .subscribe(rules => {
        this.updateDataSource(rules);
      });
  }

  updateDataSource(rules: OutboundRule[]) {
    this.dataSource = new MatTableDataSource<OutboundRule>(rules);
    setTimeout(() => {
      this.dataSource.paginator = this.paginator;
    });
  }

  openOutboundRuleDetail() {
    this.dialog
      .open(OutboundRuleDetailComponent, {
        width: '800px',
        data: <InputUpdateOutboundRule>{
          outboundRule: this.defaultRule,
          isDefaultRule: true
        }
      })
      .afterClosed()
      .subscribe(created => {
        if (created) {
          this.outboundRuleService.getDefaultOrgOutboundRule().subscribe();
        }
      });
  }

  store(rule?: OutboundRule) {
    this.dialog
      .open(CreateComponent, {
        width: '400px',
        data: <InputStoreOutboundRule>{
          isCreate: rule ? false : true,
          id: rule?.id,
          name: rule?.name
        }
      })
      .afterClosed()
      .subscribe(created => {
        if (created) {
          this.fetchOutboundRules();
        }
      });
  }

  update(rule?: OutboundRule) {
    this.dialog
      .open(OutboundRuleDetailComponent, {
        width: '800px',
        data: <InputUpdateOutboundRule>{
          outboundRule: rule,
          hasOrgLink: true,
          isDefaultRule: false
        }
      })
      .afterClosed()
      .subscribe(created => {
        if (created) {
          this.fetchOutboundRules();
        }
      });
  }

  delete(rule: OutboundRule) {
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: 'Delete outbound rule',
          message: `Are you sure to delete ${rule.name} rule ?`,
          color: 'warn'
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.outboundRuleService.deleteOutboundRule(rule.id).subscribe(_ => {
            this.fetchOutboundRules();
            this.toastService.success('Deleted successfully');
          });
        }
      });
  }

  back() {
    this.location.back();
  }
}
