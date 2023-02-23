import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  CreateOrUpdateInboundRuleReq,
  InboundRule,
  InboundRulePlan,
  InboundRuleService
} from '@b3networks/api/callcenter';
import { X } from '@b3networks/shared/common';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { PortalConfigService } from '../../../portal-config.service';

declare const $;

@Component({
  selector: 'b3n-store-caller-id-plan',
  templateUrl: './store-caller-id-plan.component.html',
  styleUrls: ['./store-caller-id-plan.component.scss']
})
export class StoreCallerIdPlanComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() rule: InboundRule;

  modalEl: any;
  callerIdPlan: InboundRulePlan;
  form: UntypedFormGroup;
  saving: boolean;
  index: number;

  destroy$ = new Subject<boolean>();

  constructor(
    private el: ElementRef,
    private fb: UntypedFormBuilder,
    private inboundRuleService: InboundRuleService,
    private portalConfigService: PortalConfigService
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
    this.initForm();

    this.portalConfigService.callerIdPlanIndex$
      .pipe(
        takeUntil(this.destroy$),
        tap(index => {
          this.index = index;
          this.callerIdPlan = index >= 0 ? this.rule.inboundRulePlans[index] : null;

          if (this.callerIdPlan) {
            const { startWith, numberLength, removePrefix, appendPrefix } = this.callerIdPlan;
            this.form.patchValue({
              startWith: startWith.join(','),
              numberLength: numberLength.join(','),
              removePrefix: removePrefix || '',
              appendPrefix
            });
          }
        })
      )
      .subscribe();
  }

  initForm() {
    this.form = this.fb.group({
      startWith: [''],
      numberLength: [''],
      removePrefix: [''],
      appendPrefix: ['']
    });

    this.form.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        tap(_ => {
          this.refresh();
        })
      )
      .subscribe();
  }

  ngAfterViewInit() {
    this.modalEl = $(this.el.nativeElement).find('div.modal');
    this.modalEl.modal({
      allowMultiple: true,
      closable: false,
      onDeny: () => {
        this.form.reset();
        this.portalConfigService.isChildModalOpen$.next(false);
      }
    });
  }

  showModal() {
    this.portalConfigService.isChildModalOpen$.next(true);
    this.modalEl.modal('show');
  }

  save() {
    this.saving = true;

    const req = {
      name: this.rule.name,
      type: 'accept',
      inboundRulePlans: this.updateInboundRulePlans()
    } as CreateOrUpdateInboundRuleReq;

    this.inboundRuleService
      .update(this.rule.id, req)
      .subscribe(
        _ => {
          this.form.reset();
          this.portalConfigService.isStoreCallerIdPlanSuccess$.next(true);
          this.portalConfigService.isChildModalOpen$.next(false);
          this.modalEl.modal('hide');
          X.showSuccess(`${this.callerIdPlan ? 'Update' : 'Add'} caller id plan successfully`);
        },
        err => {
          X.showWarn(err.message);
        }
      )
      .add(() => {
        this.saving = false;
      });
  }

  updateInboundRulePlans() {
    const plan = {
      ...this.form.value,
      startWith: this.startWith.value ? this.startWith.value.toString().split(',') : [],
      numberLength: this.numberLength.value ? this.numberLength.value.toString().split(',') : []
    } as InboundRulePlan;

    const inboundRulePlans = this.rule.inboundRulePlans || [];

    this.index >= 0 ? (inboundRulePlans[this.index] = plan) : inboundRulePlans.push(plan);

    return inboundRulePlans;
  }

  get startWith() {
    return this.form?.controls['startWith'];
  }

  get numberLength() {
    return this.form?.controls['numberLength'];
  }

  get removePrefix() {
    return this.form?.controls['removePrefix'];
  }

  get appendPrefix() {
    return this.form?.controls['appendPrefix'];
  }

  get validForm() {
    return this.startWith?.value || this.numberLength?.value || this.removePrefix?.value || this.appendPrefix?.value;
  }
}
