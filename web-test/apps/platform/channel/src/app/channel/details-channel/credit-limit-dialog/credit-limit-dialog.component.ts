import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { BuyerWallet, ChannelCreditLimitService, UpdateCreditLimitReq } from '@b3networks/api/billing';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface CreditLimitInput {
  partnerUuid: string;
  buyerWallet: BuyerWallet;
}
@Component({
  selector: 'b3n-credit-limit-dialog',
  templateUrl: './credit-limit-dialog.component.html',
  styleUrls: ['./credit-limit-dialog.component.scss']
})
export class CreditLimitDialogComponent implements OnInit {
  updating: boolean;
  creditLimitForm: UntypedFormGroup;
  temporaryIncreaseToogle: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: CreditLimitInput,
    private channelCreditLimitService: ChannelCreditLimitService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<CreditLimitDialogComponent>,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.creditLimitForm = this.fb.group({
      creditLimit: [this.data.buyerWallet.creditLimit, Validators.pattern(/^[0-9]+(\.[0-9]+)?$/)],
      temporaryIncreaseToogle: false,
      temporaryIncreaseDays: null
    });
  }

  update() {
    this.updating = true;
    const req = {
      buyerUuid: this.data.partnerUuid,
      currency: this.data.buyerWallet.currency
    } as UpdateCreditLimitReq;

    const creditLimit = +this.creditLimitForm.get('creditLimit').value;
    const temporaryIncreaseDays = +this.creditLimitForm.get('temporaryIncreaseDays').value;
    !this.temporaryIncreaseToogle
      ? (req.set = +creditLimit)
      : ((req.increase = +creditLimit - this.data.buyerWallet.creditLimit), (req.days = temporaryIncreaseDays));
    this.channelCreditLimitService
      .updateCreditLimit(req)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(res => {
        this.toastService.success('Credit limit has been updated successfully');
        this.dialogRef.close(true);
      });
  }

  toggleChanged(toggleEvent: MatSlideToggleChange) {
    this.temporaryIncreaseToogle = this.creditLimitForm.get('temporaryIncreaseToogle').value;
    toggleEvent.checked
      ? this.creditLimitForm.controls['temporaryIncreaseDays'].setValidators([
          Validators.required,
          Validators.pattern(/^\d+$/)
        ])
      : this.creditLimitForm.controls['temporaryIncreaseDays'].setValidators(null);
    this.creditLimitForm.controls['temporaryIncreaseDays'].updateValueAndValidity();
  }
}
