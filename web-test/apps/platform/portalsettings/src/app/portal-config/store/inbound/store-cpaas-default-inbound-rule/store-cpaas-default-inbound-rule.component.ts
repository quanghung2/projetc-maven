import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output
} from '@angular/core';
import { IdentityProfileQuery } from '@b3networks/api/auth';
import { InboundRule, InboundRulePlan } from '@b3networks/api/callcenter';
import { Observable, Subject } from 'rxjs';
import { filter, takeUntil, tap } from 'rxjs/operators';
import { PAGIN, PortalConfigService } from '../../../portal-config.service';

declare const $;

@Component({
  selector: 'b3n-store-cpaas-default-inbound-rule',
  templateUrl: './store-cpaas-default-inbound-rule.component.html',
  styleUrls: ['./store-cpaas-default-inbound-rule.component.scss']
})
export class StoreCpaasDefaultInboundRuleComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() iRule: InboundRule;

  @Output() openStoreCallerIdPlanModal = new EventEmitter<number>();
  @Output() removeCallerIdPlan = new EventEmitter<number>();

  modalEl: any;
  isAdmin: boolean;

  inboundRulePlans: InboundRulePlan[] = [];
  inboundRulePlansPagin: InboundRulePlan[] = [];
  loading = true;
  pagin = { ...PAGIN };

  isChildModalOpen$: Observable<boolean>;
  destroy$ = new Subject<boolean>();

  constructor(
    private el: ElementRef,
    private portalConfigService: PortalConfigService,
    private identityProfileQuery: IdentityProfileQuery
  ) {}

  refresh() {
    $(window).trigger('resize');
    this.modalEl.modal('refresh');
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
    this.modalEl.remove();
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

    this.isChildModalOpen$ = this.portalConfigService.isChildModalOpen$;
  }

  ngOnChanges() {
    this.pagin = { ...PAGIN };
    this.inboundRulePlans = this.iRule.inboundRulePlans;
    this.inboundRulePlansPagin = this.inboundRulePlans.slice(
      this.pagin.pageStart,
      this.pagin.pageStart + this.pagin.pageSize
    );

    if (this.modalEl) {
      this.refresh();
    }
  }

  ngAfterViewInit() {
    this.modalEl = $(this.el.nativeElement).find('#inbound');
    this.modalEl.modal({
      closable: false,
      autofocus: false
    });
  }

  showModal() {
    this.modalEl.modal('show');
    this.refresh();
  }

  openStoreCallerIdPlan(index: number = -1) {
    this.openStoreCallerIdPlanModal.emit(index);
  }

  removePlan(index: number) {
    this.removeCallerIdPlan.emit(index);
  }

  page(pageIndex: number) {
    let { pageStart } = this.pagin;
    const { pageSize } = this.pagin;

    if (pageStart === pageIndex - 1) {
      return;
    }

    this.pagin.pageStart = pageStart = pageIndex - 1;
    this.inboundRulePlansPagin =
      pageStart < 1
        ? this.inboundRulePlans.slice(0, pageSize)
        : this.inboundRulePlans.slice(pageStart * pageSize, pageStart * pageSize + pageSize);

    this.refresh();
  }
}
