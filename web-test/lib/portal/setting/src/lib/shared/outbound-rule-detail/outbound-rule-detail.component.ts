import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { IdentityProfileQuery, OrgLink, OrgLinkQuery, OrgLinkService } from '@b3networks/api/auth';
import {
  EntityStatus,
  ExtensionQuery,
  ExtensionService,
  OutboundRule,
  OutboundRuleService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ConfirmDialogComponent, ConfirmDialogInput } from '@b3networks/shared/ui/confirm-dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { cloneDeep } from 'lodash';
import { combineLatest } from 'rxjs';
import { filter, finalize, takeUntil, tap } from 'rxjs/operators';
import { AssignOutboundComponent, AssignOutboundInput } from './assign-outbound-rule/assign-outbound-rule.component';

export interface InputUpdateOutboundRule {
  outboundRule: OutboundRule;
  hasOrgLink: boolean;
  isDefaultRule: boolean;
}

@Component({
  selector: 'b3n-outbound-rule-detail',
  templateUrl: './outbound-rule-detail.component.html',
  styleUrls: ['./outbound-rule-detail.component.scss']
})
export class OutboundRuleDetailComponent extends DestroySubscriberComponent implements OnInit {
  fetching: boolean;
  rule: OutboundRule;
  isAdmin: boolean;
  isEdit = false;
  assignedOutbound: OutboundRule;

  outboundRules: OutboundRule[];
  extKeyActive: string;
  orgLinks: OrgLink[];
  RULE_STATUS = EntityStatus;
  savingRule: boolean;
  defaultRule: OutboundRule;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private outboundRuleService: OutboundRuleService,
    private profileQuery: IdentityProfileQuery,
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private orgLinkQuery: OrgLinkQuery,
    private orgLinkService: OrgLinkService,
    @Inject(MAT_DIALOG_DATA) public data: InputUpdateOutboundRule
  ) {
    super();
  }

  ngOnInit(): void {
    this.isAdmin = this.profileQuery.currentOrg.isUpperAdmin;
    this.outboundRuleService.getDefaultOrgOutboundRule().subscribe(rule => (this.defaultRule = rule));

    if (this.data.hasOwnProperty('outboundRule')) {
      this.isEdit = true;
      this.assignedOutbound = this.data.outboundRule;
      this.fetchData(this.assignedOutbound.id);
    } else {
      this.fetching = true;
      this.isEdit = false;
      combineLatest([this.outboundRuleService.getOutboundRules(), this.extensionQuery.selectActiveId()])
        .pipe(takeUntil(this.destroySubscriber$))
        .subscribe(([outboundRules, extKeyActive]) => {
          this.outboundRules = outboundRules;
          this.extKeyActive = extKeyActive.toString();
          this.getExtensionDetail();
        });
    }

    if (!this.data.hasOrgLink) {
      return;
    }

    this.orgLinkService
      .getGroups(this.profileQuery.getProfile().uuid)
      .pipe(tap(_ => this.fetchOrgLinks()))
      .subscribe();
  }

  fetchOrgLinks() {
    this.orgLinkQuery
      .selectAll()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(orgLinks => !!orgLinks && !!orgLinks.length),
        tap(orgLinks => {
          this.orgLinks = orgLinks
            .reduce<OrgLink[]>((prev, curr) => {
              const orgLink = cloneDeep(curr);
              orgLink.organizations = orgLink.organizations.filter(
                o => !!o.name && o.uuid !== this.profileQuery.currentOrg.orgUuid
              );
              prev.push(orgLink);

              return prev;
            }, [])
            .filter(o => !!o.organizations?.length);
        })
      )
      .subscribe();
  }

  getExtensionDetail() {
    this.extensionService.getDetails(this.extKeyActive).subscribe(ext => {
      if (ext.outgoingCallRule) {
        this.assignedOutbound = this.outboundRules.find(r => r.name === ext.outgoingCallRule);
        if (this.assignedOutbound) {
          this.fetchData(this.assignedOutbound.id);
        }
      } else {
        this.assignedOutbound = null;
      }
      this.fetching = false;
    });
  }

  fetchData(ruleId: number) {
    this.outboundRuleService
      .getOutboundRuleById(ruleId)
      .pipe(takeUntil(this.destroySubscriber$))
      .pipe(finalize(() => (this.fetching = false)))
      .subscribe(rule => {
        this.rule = rule;
      });
  }

  routingRuleList() {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  onDialPlanChange(event: boolean) {
    if (event) {
      this.fetchData(this.rule.id);
    }
  }

  onCountriesWhiteListChange(event: boolean) {
    if (event) {
      this.fetchData(this.rule.id);
    }
  }

  routingManageOutboundPage() {
    this.router.navigate(['manage-outbound'], { relativeTo: this.route.parent });
  }

  assignExtensionToOutboundRule() {
    this.dialog
      .open(AssignOutboundComponent, {
        width: '450px',
        autoFocus: false,
        data: <AssignOutboundInput>{
          extKey: this.extKeyActive,
          outbountRule: this.outboundRules
        }
      })
      .afterClosed()
      .subscribe(res => {
        this.getExtensionDetail();
      });
  }

  editOutboundRule() {
    const status = this.defaultRule.status === this.RULE_STATUS.ACTIVE ? 'Disable' : 'Enable';
    this.dialog
      .open(ConfirmDialogComponent, {
        width: '400px',
        data: <ConfirmDialogInput>{
          title: `${status} Default Rule`,
          message: `Are you sure to ${status.toLocaleLowerCase()} default rule?`,
          color: this.defaultRule.status === this.RULE_STATUS.ACTIVE ? 'warn' : 'primary',
          confirmLabel: status
        }
      })
      .afterClosed()
      .subscribe(confirmed => {
        if (confirmed) {
          this.savingRule = true;
          this.outboundRuleService
            .updateOutboundRule(this.defaultRule.id, {
              status:
                this.defaultRule.status === this.RULE_STATUS.ACTIVE
                  ? this.RULE_STATUS.INACTIVE
                  : this.RULE_STATUS.ACTIVE
            })
            .pipe(finalize(() => (this.savingRule = false)))
            .subscribe(
              _ => {
                this.outboundRuleService.getDefaultOrgOutboundRule().subscribe(rule => {
                  this.defaultRule = rule;
                });
                this.toastService.success(
                  `${
                    this.defaultRule.status === this.RULE_STATUS.ACTIVE ? 'Disable' : 'Enable'
                  } outbound rule successfully`
                );
              },
              err => this.toastService.warning(err.message)
            );
        }
      });
  }
}
