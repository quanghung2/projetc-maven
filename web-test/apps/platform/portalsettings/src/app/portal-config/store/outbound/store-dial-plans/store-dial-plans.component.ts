import { AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { DialPlanDetail, DialPlanV3, OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { X } from '@b3networks/shared/common';
import { Subject } from 'rxjs';
import { takeUntil, tap } from 'rxjs/operators';
import { PortalConfigService } from '../../../portal-config.service';

declare const $;

@Component({
  selector: 'b3n-store-dial-plans',
  templateUrl: './store-dial-plans.component.html',
  styleUrls: ['./store-dial-plans.component.scss']
})
export class StoreDialPlansComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() rule: OutboundRule;

  dialPlan: DialPlanV3;
  modalEl: any;
  form: UntypedFormGroup;
  saving: boolean;

  destroy$ = new Subject<boolean>();

  constructor(
    private el: ElementRef,
    private fb: UntypedFormBuilder,
    private outboundRuleService: OutboundRuleService,
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

    this.portalConfigService.dialPlan$
      .pipe(
        takeUntil(this.destroy$),
        tap(dialPlan => {
          this.dialPlan = dialPlan;

          if (this.dialPlan) {
            const { startWith, numberLength, removePrefix, appendPrefix } = this.dialPlan.planDetail;
            this.form.patchValue({
              startWith: startWith.join(','),
              numberLength: numberLength.join(','),
              removePrefix,
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

    const planDetail = {
      ...this.form.value,
      startWith: this.startWith?.value ? this.startWith.value.toString().split(',') : [],
      numberLength: this.numberLength?.value ? this.numberLength.value.toString().split(',') : []
    } as DialPlanDetail;

    const dialPlan = {
      ...this.dialPlan,
      planDetail: planDetail,
      outGoingCallRuleId: this.rule.id,
      isEditing: true
    } as DialPlanV3;

    this.outboundRuleService
      .importDialPlan(dialPlan)
      .subscribe(
        _ => {
          this.form.reset();
          this.portalConfigService.isStoreDialPlansSuccess$.next(true);
          this.portalConfigService.isChildModalOpen$.next(false);
          this.modalEl.modal('hide');
          X.showSuccess(`${this.dialPlan ? 'Update' : 'Add'} dial plan successfully`);
        },
        err => {
          X.showWarn(err.message);
        }
      )
      .add(() => {
        this.saving = false;
      });
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
