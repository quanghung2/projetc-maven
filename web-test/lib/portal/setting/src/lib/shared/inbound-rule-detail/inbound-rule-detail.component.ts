import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { Extension } from '@b3networks/api/bizphone';
import { ExtensionQuery, ExtensionService, InboundRule, InboundRuleService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { forkJoin, Observable } from 'rxjs';
import { filter, finalize, map, switchMap, take, takeUntil } from 'rxjs/operators';
import { AssignInboundInput, AssignInboundRuleComponent } from './assign-inbound-rule/assign-inbound-rule.component';

@Component({
  selector: 'b3n-inbound-rule-detail',
  templateUrl: './inbound-rule-detail.component.html',
  styleUrls: ['./inbound-rule-detail.component.scss']
})
export class InboundRuleDetailComponent extends DestroySubscriberComponent implements OnInit {
  extDetail$: Observable<Extension>;
  isAdmin: boolean;
  fetching: boolean;
  inboundRules: InboundRule[] = [];
  assignedRule: InboundRule;

  constructor(
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private profileQuery: IdentityProfileQuery,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private inboundRuleService: InboundRuleService
  ) {
    super();
  }

  ngOnInit(): void {
    this.fetching = true;
    this.isAdmin = this.profileQuery.currentOrg.isUpperAdmin;

    this.extDetail$ = this.extensionQuery.selectActive().pipe(map(m => m as Extension));
    this.extensionQuery
      .selectActiveId()
      .pipe(
        filter(id => !!id),
        switchMap(id => {
          return forkJoin([this.extensionService.getDetails(id.toString()), this.inboundRuleService.getInboundRules()]);
        })
      )
      .pipe(take(1))
      .pipe(takeUntil(this.destroySubscriber$))
      .pipe(finalize(() => (this.fetching = false)))
      .subscribe(([_, inboundRules]) => {
        this.inboundRules = inboundRules;
        const inboundRuleName = this.extensionQuery.getActive()['incomingCallRule'];
        if (inboundRuleName) {
          this.assignedRule = this.inboundRules.find(rule => rule.name === inboundRuleName);
        }
      });
  }

  routingManageInboundPage() {
    this.router.navigate(['manage-inbound'], { relativeTo: this.route.parent });
  }

  assignInboundRule(ext: Extension) {
    this.dialog
      .open(AssignInboundRuleComponent, {
        width: '450px',
        autoFocus: false,
        data: <AssignInboundInput>{
          extension: ext,
          inboundRules: this.inboundRules
        }
      })
      .afterClosed()
      .subscribe(status => {
        if (status && status.ok) {
          this.getAssginedRule();
        }
      });
  }

  private getAssginedRule() {
    this.inboundRuleService.getInboundRules().subscribe(inboundRules => {
      this.inboundRules = inboundRules;
      const inboundRuleName = this.extensionQuery.getActive()['incomingCallRule'];
      this.assignedRule = this.inboundRules.find(rule => rule.name === inboundRuleName);
    });
  }
}
