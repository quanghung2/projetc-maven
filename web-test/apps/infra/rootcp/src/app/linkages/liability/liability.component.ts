import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { PrepaymentLicense, PrepaymentLicenseService } from '@b3networks/api/billing';
import { ToastService } from '@b3networks/shared/ui/toast';
import { throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-liability',
  templateUrl: './liability.component.html',
  styleUrls: ['./liability.component.scss']
})
export class LiabilityComponent implements OnInit {
  prepaymentLicense: PrepaymentLicense;
  saving: boolean;
  form: UntypedFormGroup;
  loading: boolean;
  domain: string;

  constructor(
    private prepaymentLicenseService: PrepaymentLicenseService,
    private toastService: ToastService,
    private fb: UntypedFormBuilder
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      domain: ['', Validators.required]
    });
  }

  search() {
    this.loading = true;
    this.saving = true;
    this.prepaymentLicenseService
      .getPrepaymentLicence(this.form.controls['domain'].value)
      .pipe(
        tap(res => {
          this.prepaymentLicense = res;
          this.domain = this.form.controls['domain'].value;
        }),
        catchError(err => {
          this.prepaymentLicense = null;
          this.domain = '';
          this.toastService.warning(err.message);
          return throwError(err);
        }),
        finalize(() => {
          this.loading = false;
          this.saving = false;
        })
      )
      .subscribe();
  }

  updatePrepaymentLicense(change: MatSlideToggleChange) {
    this.saving = true;
    this.prepaymentLicenseService
      .updatePrepaymentLicence(this.domain, { enabled: change.checked })
      .subscribe(
        _ => this.toastService.success(`Update liability check successfully`),
        err => this.toastService.warning(err.message)
      )
      .add(() => (this.saving = false));
  }
}
