import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProfileOrg } from '@b3networks/api/auth';
import { TransferCreditReq, Wallet, WalletService } from '@b3networks/api/billing';
import { X } from '@b3networks/shared/common';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'pop-tranfer-credit',
  templateUrl: './tranfer-credit.component.html',
  styleUrls: ['./tranfer-credit.component.scss']
})
export class TranferCreditComponent implements OnInit {
  wallet: Wallet;
  transferOrg: ProfileOrg;
  orgs: ProfileOrg[] = [];
  isLoading: boolean;
  error: string;

  formGroup: UntypedFormGroup;

  get transferAmount() {
    return this.formGroup.get('transferAmount');
  }

  get orgSelected() {
    return this.formGroup.get('orgSelected');
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) private data,
    private dialogRef: MatDialogRef<TranferCreditComponent>,
    private walletService: WalletService,
    private fb: UntypedFormBuilder
  ) {
    this.formGroup = this.fb.group({
      transferAmount: ['', Validators.required],
      orgSelected: ['']
    });
  }

  ngOnInit(): void {
    this.wallet = this.data.wallet;
    this.orgs = this.data.organization.filter(org => org.orgUuid !== X.getContext()['orgUuid']);
    this.orgSelected.setValue(this.orgs[0].orgUuid);
  }

  close() {
    this.dialogRef.close();
  }

  onChangeTransferAmount(event) {
    this.validate();
  }

  onTransfer() {
    if (this.validate()) {
      this.isLoading = true;
      this.transferOrg = this.orgs.find(org => org.orgUuid === this.orgSelected.value);
      this.walletService
        .transferCredit(
          this.transferOrg.walletUuid,
          new TransferCreditReq(this.transferOrg.walletCurrencyCode, this.transferAmount.value)
        )
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe(
          data => {
            this.dialogRef.close({ success: true });
          },
          error => {
            this.error = 'The application has encountered an unknown error.';
          }
        );
    }
  }

  private validate() {
    this.error = '';
    if (!(this.transferAmount.value && this.isNumeric(this.transferAmount.value))) {
      this.error = 'Invalid transfer amount. Please check again';
    } else if (this.transferAmount.value === 0) {
      this.error = 'Transfer amount must large than 0';
    }
    return !this.error;
  }

  private isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
}
