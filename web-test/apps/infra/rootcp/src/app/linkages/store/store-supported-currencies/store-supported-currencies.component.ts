import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PartnerService } from '@b3networks/api/partner';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface StoreSupportedCurrenciesInput {
  supportedCurrencies: string[];
  domain: string;
}

@Component({
  selector: 'b3n-store-supported-currencies',
  templateUrl: './store-supported-currencies.component.html',
  styleUrls: ['./store-supported-currencies.component.scss']
})
export class StoreSupportedCurrenciesComponent implements OnInit {
  form: UntypedFormGroup;
  saving: boolean;

  constructor(
    public dialogRef: MatDialogRef<StoreSupportedCurrenciesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreSupportedCurrenciesInput,
    private fb: UntypedFormBuilder,
    private partnerService: PartnerService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      currency: ['', Validators.required]
    });
  }

  storeSupportedCurrencies() {
    const currencyControl = this.form.controls['currency'];
    const value = currencyControl.value.trim().toUpperCase();

    if (this.data.supportedCurrencies.includes(value)) {
      currencyControl.setErrors({
        exist: true
      });
    } else {
      this.saving = true;
      this.partnerService
        .updateSupportedCurrencies(this.data.domain, [...this.data.supportedCurrencies, value])
        .subscribe(
          _ => {
            this.toastService.success('Add currency successfully');
            this.data.supportedCurrencies.push(value);
            this.dialogRef.close();
          },
          err => this.toastService.warning(err.message)
        )
        .add(() => (this.saving = false));
    }
  }

  get currency() {
    return this.form.controls['currency'];
  }
}
