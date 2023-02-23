import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DialPlanDetail, DialPlanV3, OutboundRule, OutboundRuleService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { InputStoreDialPlan } from '../dial-plan/dial-plan.component';

@Component({
  selector: 'pos-add-dial-plan',
  templateUrl: './store-dial-plan.component.html',
  styleUrls: ['./store-dial-plan.component.scss']
})
export class StoreDialPlanComponent implements OnInit {
  addPlanForm: UntypedFormGroup;
  adding: boolean;
  rule: OutboundRule;

  get startWith(): UntypedFormControl {
    return this.addPlanForm.get('startWith') as UntypedFormControl;
  }

  get numberLength(): UntypedFormControl {
    return this.addPlanForm.get('numberLength') as UntypedFormControl;
  }

  get removePrefix(): UntypedFormControl {
    return this.addPlanForm.get('removePrefix') as UntypedFormControl;
  }

  get appendPrefix(): UntypedFormControl {
    return this.addPlanForm.get('appendPrefix') as UntypedFormControl;
  }

  get validForm() {
    return this.startWith.value || this.numberLength.value || this.removePrefix.value || this.appendPrefix.value;
  }

  constructor(
    private fb: UntypedFormBuilder,
    private outboundRuleService: OutboundRuleService,
    @Inject(MAT_DIALOG_DATA) public data: InputStoreDialPlan,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<StoreDialPlanComponent>
  ) {
    this.rule = data.rule;
    const dialPlan = data['dialPlan'] as DialPlanV3;
    this.addPlanForm = this.fb.group({
      startWith: dialPlan?.planDetail.startWith ? [dialPlan?.planDetail.startWith] : [],
      numberLength: dialPlan?.planDetail.numberLength ? [dialPlan?.planDetail.numberLength] : [],
      removePrefix: dialPlan?.planDetail.removePrefix ? dialPlan?.planDetail.removePrefix : '',
      appendPrefix: dialPlan?.planDetail.appendPrefix ? dialPlan?.planDetail.appendPrefix : ''
    });
  }

  ngOnInit(): void {}

  add() {
    this.adding = true;
    const planDetail = {
      ...this.addPlanForm.value,
      startWith: this.addPlanForm.value.startWith ? this.addPlanForm.value.startWith.toString().split(',') : [],
      numberLength: this.addPlanForm.value.numberLength ? this.addPlanForm.value.numberLength.toString().split(',') : []
    } as DialPlanDetail;

    const dialPlan = {
      ...this.data.dialPlan,
      planDetail: planDetail,
      outGoingCallRuleId: this.rule.id,
      isEditing: true
    } as DialPlanV3;
    this.outboundRuleService
      .importDialPlan(dialPlan)
      .pipe(finalize(() => (this.adding = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ added: true });
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
