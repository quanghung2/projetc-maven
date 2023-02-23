import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { PartnerService } from '@b3networks/api/partner';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { StoreSupportedCurrenciesComponent } from '../store/store-supported-currencies/store-supported-currencies.component';

@Component({
  selector: 'b3n-supported-currencies',
  templateUrl: './supported-currencies.component.html',
  styleUrls: ['./supported-currencies.component.scss']
})
export class SupportedCurrenciesComponent extends DestroySubscriberComponent implements OnInit {
  loading: boolean;
  supportedCurrencies: string[] = [];
  form: UntypedFormGroup;
  canAdd: boolean;

  constructor(
    public dialog: MatDialog,
    private partnerService: PartnerService,
    private fb: UntypedFormBuilder,
    private toastService: ToastService
  ) {
    super();
  }

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      domain: ['', Validators.required]
    });
  }

  searchSupportedCurrencies() {
    this.loading = true;
    this.supportedCurrencies = [];
    this.partnerService
      .getPartnerWithDomain(this.form.controls['domain'].value)
      .pipe(
        tap(partner => {
          this.canAdd = true;
          this.supportedCurrencies = partner.supportedCurrencies;
        }),
        catchError(err => {
          this.canAdd = false;
          this.toastService.warning(err.message);
          return throwError(err);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe();
  }

  openStoreSupportedCurrencies(): void {
    this.dialog.open(StoreSupportedCurrenciesComponent, {
      width: '500px',
      data: { supportedCurrencies: this.supportedCurrencies, domain: this.form.controls['domain'].value },
      disableClose: true
    });
  }
}
