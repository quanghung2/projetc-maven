import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Vendor, VendorService } from '@b3networks/api/sms';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface AddEditDialogInput {
  title: 'Create' | 'Edit';
  vendor: Vendor;
  vendorCodes: string[];
}

@Component({
  selector: 'b3n-store-vendor-dialog',
  templateUrl: './store-vendor-dialog.component.html',
  styleUrls: ['./store-vendor-dialog.component.scss']
})
export class StoreVendorDialogComponent implements OnInit {
  form: UntypedFormGroup;
  hidePassword = true;
  saving = false;

  constructor(
    public dialogRef: MatDialogRef<StoreVendorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AddEditDialogInput,
    private fb: UntypedFormBuilder,
    private vendorService: VendorService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();

    this.vendorService
      .getVendorCodes()
      .pipe(
        tap(vendorCodes => {
          this.data.vendorCodes = vendorCodes;
          if (this.data.vendor == null) {
            this.form.patchValue({
              code: vendorCodes[0]
            });
          }
        })
      )
      .subscribe();
  }

  initForm() {
    this.form = this.fb.group({
      code: ['', Validators.required],
      label: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]+$/), Validators.maxLength(50)]],
      username: ['', [Validators.required, Validators.maxLength(64)]],
      password: ['', [Validators.required, Validators.maxLength(256)]],
      endpoint: ['', Validators.required],
      restMaxRatePerSec: [10, [Validators.required, Validators.min(1), Validators.max(1000)]]
    });

    if (this.data.vendor) {
      const { code, label, username, password, endpoint, restMaxRatePerSec } = this.data.vendor;
      console.log(this.data.vendor);

      console.log(code);

      this.form.setValue({
        code,
        label,
        username,
        password,
        endpoint,
        restMaxRatePerSec
      });
      console.log(this.form.value);

      // this.form.controls['code'].disable();
      this.form.controls['endpoint'].disable();
    }
  }

  save() {
    this.saving = true;

    const { code, label, name, username, password, endpoint, restMaxRatePerSec } = this.form.controls;
    const obs: Observable<Partial<Vendor>> =
      this.data.title === 'Create'
        ? this.vendorService.createVendor(
            {
              label: label.value,
              endpoint: endpoint.value,
              username: username.value,
              password: password.value,
              restMaxRatePerSec: restMaxRatePerSec.value
            },
            code.value
          )
        : this.vendorService.updateVendor(
            {
              username: username.value,
              password: password.value,
              restMaxRatePerSec: restMaxRatePerSec.value,
              label: label.value
            },
            code.value,
            this.data.vendor.name
          );

    obs.subscribe(
      () => {
        this.toastService.success(`${this.data.title} vendor successfully`);
        this.dialogRef.close({ isAdd: this.data.title === 'Create' });
      },
      err => {
        this.toastService.warning(err.message);
        this.saving = false;
      }
    );
  }

  restMaxRatePerSecKeyDown(e: KeyboardEvent) {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  }

  get label() {
    return this.form.controls['label'];
  }

  get username() {
    return this.form.controls['username'];
  }

  get password() {
    return this.form.controls['password'];
  }

  get endpoint() {
    return this.form.controls['endpoint'];
  }

  get restMaxRatePerSec() {
    return this.form.controls['restMaxRatePerSec'];
  }
}
