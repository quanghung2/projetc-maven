import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import {
  CreateOrUpdateInboundRuleReq,
  ExtensionQuery,
  ExtensionService,
  InboundRule,
  InboundRulePlan,
  InboundRuleService
} from '@b3networks/api/callcenter';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface StoreCallerIdPlanInput {
  rule: InboundRule;
  callerIdPlan: InboundRulePlan;
  index: number;
}

@Component({
  selector: 'b3n-store-caller-id-plan',
  templateUrl: './store-caller-id-plan.component.html',
  styleUrls: ['./store-caller-id-plan.component.scss']
})
export class StoreCallerIdPlanComponent implements OnInit {
  storePlanForm: UntypedFormGroup;
  adding: boolean;
  rule: InboundRule;

  get startWith(): UntypedFormControl {
    return this.storePlanForm.get('startWith') as UntypedFormControl;
  }

  get numberLength(): UntypedFormControl {
    return this.storePlanForm.get('numberLength') as UntypedFormControl;
  }

  get removePrefix(): UntypedFormControl {
    return this.storePlanForm.get('removePrefix') as UntypedFormControl;
  }

  get appendPrefix(): UntypedFormControl {
    return this.storePlanForm.get('appendPrefix') as UntypedFormControl;
  }

  get validForm() {
    return this.startWith.value || this.numberLength.value || this.removePrefix.value || this.appendPrefix.value;
  }

  constructor(
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: StoreCallerIdPlanInput,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<StoreCallerIdPlanComponent>,
    private extensionService: ExtensionService,
    private extensionQuery: ExtensionQuery,
    private inboundRuleService: InboundRuleService
  ) {
    this.rule = data.rule;
    const callerIdPlan = data.callerIdPlan as InboundRulePlan;
    this.storePlanForm = this.fb.group({
      startWith: callerIdPlan?.startWith ? [callerIdPlan?.startWith] : [],
      numberLength: callerIdPlan?.numberLength ? [callerIdPlan?.numberLength] : [],
      removePrefix: callerIdPlan?.removePrefix ? callerIdPlan?.removePrefix : '',
      appendPrefix: callerIdPlan?.appendPrefix ? callerIdPlan?.appendPrefix : ''
    });
  }

  ngOnInit(): void {}

  add() {
    this.adding = true;

    const req = {
      name: this.rule.name,
      type: 'accept',
      inboundRulePlans: this.updateInboundRulePlans()
    } as CreateOrUpdateInboundRuleReq;

    this.inboundRuleService
      .update(this.data.rule.id, req)
      .pipe(finalize(() => (this.adding = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ ok: true });
          this.toastService.success('Added successfully');
        },
        error => {
          this.toastService.error(error.message || 'Cannot add plan. Please try again later');
        }
      );
  }

  updateInboundRulePlans() {
    const plan = {
      ...this.storePlanForm.value,
      startWith: this.storePlanForm.value.startWith ? this.storePlanForm.value.startWith.toString().split(',') : [],
      numberLength: this.storePlanForm.value.numberLength
        ? this.storePlanForm.value.numberLength.toString().split(',')
        : []
    } as InboundRulePlan;

    let inboundRulePlans = this.rule.inboundRulePlans || [];

    const index = this.data.index;
    index >= 0 ? (inboundRulePlans[index] = plan) : inboundRulePlans.push(plan);
    return inboundRulePlans;
  }
}
