import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { DialPlanV3, OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { X } from '@b3networks/shared/common';
import { Subject } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { ConfirmModalComponent } from '../../../common/confirm-modal/confirm-modal.component';
import { PAGIN, PortalConfigService } from '../../portal-config.service';
import { ImportDialPlansComponent } from '../../store/outbound/import-dial-plans/import-dial-plans.component';
import { StoreDialPlansComponent } from '../../store/outbound/store-dial-plans/store-dial-plans.component';

@Component({
  selector: 'b3n-dial-plans',
  templateUrl: './dial-plans.component.html',
  styleUrls: ['./dial-plans.component.scss']
})
export class DialPlansComponent implements OnInit, OnDestroy {
  @Input() oRule: OutboundRule;

  @Output() setLoading = new EventEmitter<boolean>();
  @Output() refresh = new EventEmitter<any>();

  @ViewChild(StoreDialPlansComponent) storeDialPlansModal: StoreDialPlansComponent;
  @ViewChild(ImportDialPlansComponent) importDialsPlanModal: ImportDialPlansComponent;
  @ViewChild(ConfirmModalComponent) confirmModal: ConfirmModalComponent;

  isAdmin: boolean;

  pagin = { ...PAGIN };
  lstDialPlan: DialPlanV3[] = [];
  lstDialPlanPagin: DialPlanV3[] = [];

  destroy$ = new Subject<boolean>();

  constructor(
    private portalConfigService: PortalConfigService,
    private outboundRuleService: OutboundRuleService,
    private identityProfileQuery: IdentityProfileQuery
  ) {}

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.identityProfileQuery.profile$
      .pipe(
        takeUntil(this.destroy$),
        filter(profile => !!profile),
        tap(_ => {
          this.isAdmin = this.identityProfileQuery.currentOrg.isUpperAdmin;
        })
      )
      .subscribe();

    this.portalConfigService.isStoreDialPlansSuccess$
      .pipe(
        takeUntil(this.destroy$),
        filter(success => !!success),
        tap(_ => {
          this.fetchData();
        })
      )
      .subscribe();

    this.fetchData();
  }

  fetchData() {
    this.setLoading.emit(true);
    this.outboundRuleService
      .getDialPlans(this.oRule.id)
      .pipe(
        tap(res => {
          this.pagin = { ...PAGIN };
          this.lstDialPlan = res;
          this.lstDialPlanPagin = this.lstDialPlan.slice(
            this.pagin.pageStart,
            this.pagin.pageStart + this.pagin.pageSize
          );
          this.setLoading.emit(false);
          this.refresh.emit();
        })
      )
      .subscribe();
  }

  openStoreDialPlansModal(dialPlan?: DialPlanV3) {
    this.portalConfigService.dialPlan$.next(dialPlan);
    this.storeDialPlansModal.showModal();
  }

  openImportDialPLanModal() {
    this.importDialsPlanModal.showModal();
  }

  removeDialPlan(plan: DialPlanV3) {
    this.portalConfigService.isChildModalOpen$.next(true);
    this.confirmModal
      .show({ header: 'Confirm remove', message: 'Are you sure to remove this plan?' })
      .subscribe(res => {
        if (!res) {
          return;
        }

        this.outboundRuleService.removeDialPlan(plan).subscribe(
          _ => {
            X.showSuccess('Remove dial plan successfully');
            this.fetchData();
          },
          err => {
            X.showWarn(err.message);
          }
        );
      })
      .add(() => this.portalConfigService.isChildModalOpen$.next(false));
  }

  page(pageIndex: number) {
    let { pageStart } = this.pagin;
    const { pageSize } = this.pagin;

    if (pageStart === pageIndex - 1) {
      return;
    }

    this.pagin.pageStart = pageStart = pageIndex - 1;
    this.lstDialPlanPagin =
      pageStart < 1
        ? this.lstDialPlan.slice(0, pageSize)
        : this.lstDialPlan.slice(pageStart * pageSize, pageStart * pageSize + pageSize);

    this.refresh.emit();
  }
}
