import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AdminApp, PartnerService } from '@b3networks/api/partner';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface StoreAdminAppAccessInput {
  adminApp: AdminApp;
}

@Component({
  selector: 'b3n-store-admin-app-access',
  templateUrl: './store-admin-app-access.component.html',
  styleUrls: ['./store-admin-app-access.component.scss']
})
export class StoreAdminAppAccessComponent implements OnInit {
  form: UntypedFormGroup;
  visibilityTypes = [
    { key: 'ALL', value: 'All' },
    { key: 'NONE', value: 'None' }
  ];
  visibilityExceptions: string[] = [];
  saving: boolean;

  constructor(
    public dialogRef: MatDialogRef<StoreAdminAppAccessComponent>,
    @Inject(MAT_DIALOG_DATA) public data: StoreAdminAppAccessInput,
    private fb: UntypedFormBuilder,
    private partnerService: PartnerService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();

    if (this.data.adminApp) {
      const { appId, name, visibilityType, visibilityExceptions } = this.data.adminApp;

      this.form.patchValue({
        appId,
        name,
        visibilityType
      });

      this.visibilityExceptions = visibilityExceptions;
      this.form.controls['appId'].disable();
    }
  }

  initForm() {
    this.form = this.fb.group({
      appId: ['', Validators.required],
      name: ['', Validators.required],
      visibilityType: [this.visibilityTypes[0].key, Validators.required],
      visibilityException: ['']
    });
  }

  addException() {
    const exception = this.form.controls['visibilityException'];
    const value = exception.value.trim().toLowerCase();

    if (this.visibilityExceptions.includes(value)) {
      exception.setErrors({
        exist: true
      });
    } else {
      this.visibilityExceptions.push(value);
      exception.reset();
    }
  }

  removeException(exception: string) {
    this.visibilityExceptions = this.visibilityExceptions.filter(e => e !== exception);
  }

  storeAdminApp() {
    this.saving = true;

    const { appId, name, visibilityType } = this.form.controls;
    const adminApp: AdminApp = {
      appId: appId.value,
      name: name.value,
      visibilityType: visibilityType.value,
      visibilityExceptions: this.visibilityExceptions
    };

    this.partnerService
      .storeAdminApps(adminApp)
      .subscribe(
        res => {
          this.toastService.success(`${this.data.adminApp ? 'Update' : 'Create'} admin app successfully`);
          this.dialogRef.close(res);
        },
        err => this.toastService.warning(err.message)
      )
      .add(() => (this.saving = false));
  }

  get visibilityException() {
    return this.form.controls['visibilityException'];
  }
}
