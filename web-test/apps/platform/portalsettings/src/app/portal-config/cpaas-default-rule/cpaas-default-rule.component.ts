import { Component, OnInit, ViewChild } from '@angular/core';
import {
  CreateOrUpdateInboundRuleReq,
  InboundRule,
  InboundRuleService,
  OutboundRule,
  OutboundRuleService
} from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, X } from '@b3networks/shared/common';
import { combineLatest, forkJoin, throwError } from 'rxjs';
import { catchError, filter, finalize, takeUntil, tap } from 'rxjs/operators';
import { ConfirmModalComponent } from '../../common/confirm-modal/confirm-modal.component';
import { PortalConfigService } from '../portal-config.service';
import { StoreCallerIdPlanComponent } from '../store/inbound/store-caller-id-plan/store-caller-id-plan.component';
import { StoreCpaasDefaultInboundRuleComponent } from '../store/inbound/store-cpaas-default-inbound-rule/store-cpaas-default-inbound-rule.component';
import { StoreCpaasDefaultOutboundRuleComponent } from '../store/outbound/store-cpaas-default-outbound-rule/store-cpaas-default-outbound-rule.component';

interface DefaultRule {
  oRule: OutboundRule;
  iRule: InboundRule;
}

enum DefaultRuleMap {
  oRule = 'oRule',
  iRule = 'iRule'
}

@Component({
  selector: 'b3n-cpaas-default-rule',
  templateUrl: './cpaas-default-rule.component.html',
  styleUrls: ['./cpaas-default-rule.component.scss']
})
export class CpaasDefaultRuleComponent extends DestroySubscriberComponent implements OnInit {
  @ViewChild(StoreCpaasDefaultOutboundRuleComponent) storeOutboundRuleModal: StoreCpaasDefaultOutboundRuleComponent;
  @ViewChild(StoreCpaasDefaultInboundRuleComponent) storeInboundRuleModal: StoreCpaasDefaultInboundRuleComponent;
  @ViewChild(StoreCallerIdPlanComponent) storeCallerIdPlanModal: StoreCallerIdPlanComponent;
  @ViewChild(ConfirmModalComponent) confirmModal: ConfirmModalComponent;

  defaultRule: DefaultRule;

  loading = true;
  defaultRuleMap = DefaultRuleMap;
  keys = Object.keys;

  constructor(
    private inboundRuleService: InboundRuleService,
    private outboundRuleService: OutboundRuleService,
    private portalConfigService: PortalConfigService
  ) {
    super();
  }

  ngOnInit(): void {
    //! Init
    forkJoin([this.outboundRuleService.getDefaultOutboundRule(), this.inboundRuleService.getDefaultInboundRule()])
      .pipe(
        tap(([oRule, iRule]) => {
          this.defaultRule = {
            oRule,
            iRule
          };
        }),
        catchError(e => {
          X.showWarn(e.message);
          return throwError(e);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe();

    //? Outbound - refetch after storing data
    combineLatest([
      this.portalConfigService.isStoreCountryWhitelistSuccess$,
      this.portalConfigService.isStoreOrgLinkSuccess$
    ])
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(
          ([isStoreCountryWhitelistSuccess, isStoreOrgLinkSuccess]) =>
            !!isStoreCountryWhitelistSuccess || !!isStoreOrgLinkSuccess
        ),
        tap(_ => {
          this.outboundRuleService
            .getDefaultOutboundRule()
            .pipe(
              tap(rule => {
                this.defaultRule.oRule = rule;
              })
            )
            .subscribe();
        })
      )
      .subscribe();

    //? Inbound - refetch after storing data
    this.portalConfigService.isStoreCallerIdPlanSuccess$
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(isStoreCallerIdPlanSuccess => !!isStoreCallerIdPlanSuccess),
        tap(_ => {
          this.inboundRuleService
            .getDefaultInboundRule()
            .pipe(
              tap(rule => {
                this.defaultRule.iRule = rule;
              })
            )
            .subscribe();
        })
      )
      .subscribe();
  }

  openOutboundModal() {
    this.storeOutboundRuleModal.showModal();
  }

  openInboundModal() {
    this.storeInboundRuleModal.showModal();
  }

  openStoreCallerIdPlanModal(index: number = -1) {
    this.portalConfigService.callerIdPlanIndex$.next(index);
    this.storeCallerIdPlanModal.showModal();
  }

  removeCallerIdPlan(index: number) {
    this.portalConfigService.isChildModalOpen$.next(true);
    this.confirmModal
      .show({
        header: 'Confirm remove',
        message: `Are you sure to remove this caller id plan?`
      })
      .pipe(
        finalize(() => this.portalConfigService.isChildModalOpen$.next(false)),
        filter(res => !!res),
        tap(_ => {
          const { iRule } = this.defaultRule;
          const newPlans = iRule.inboundRulePlans;

          if (index >= 0) {
            newPlans.splice(index, 1);
          }

          const req = {
            name: iRule.name,
            type: 'accept',
            inboundRulePlans: newPlans
          } as CreateOrUpdateInboundRuleReq;

          this.inboundRuleService.update(iRule.id, req).subscribe(
            _ => {
              X.showSuccess('Delete caller id plan successfully');
              this.portalConfigService.isStoreCallerIdPlanSuccess$.next(true);
            },
            error => {
              X.showWarn(error.message);
            }
          );
        })
      )
      .subscribe();
  }
}
