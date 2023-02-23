import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { DashboardV2Service, PublicDevice } from '@b3networks/api/dashboard';
import { DEFAULT_WARNING_MESSAGE } from '@b3networks/portal/setting';
import { ToastService } from '@b3networks/shared/ui/toast';
import { firstValueFrom } from 'rxjs';

export interface EditDeviceInput {
  device: PublicDevice;
}

export type DeviceForm = FormGroup<{
  name: FormControl<string>;
}>;

@Component({
  selector: 'b3n-edit-device',
  templateUrl: './edit-device.component.html',
  styleUrls: ['./edit-device.component.scss']
})
export class EditDeviceComponent implements OnInit {
  form: DeviceForm;
  loading: boolean;

  constructor(
    public dialogRef: MatDialogRef<EditDeviceComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditDeviceInput,
    private fb: FormBuilder,
    private dashboardV2Service: DashboardV2Service,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      name: ['', [Validators.required]]
    });

    if (this.data.device) {
      this.form.patchValue({
        name: this.data.device.deviceName
      });
    }
  }

  async save() {
    try {
      this.loading = true;
      await firstValueFrom(
        this.dashboardV2Service.updateDevice(this.data.device.deviceId, {
          deviceName: this.form.controls['name'].value
        })
      );
      this.toastService.success(`Update successfully`);
      this.dialogRef.close(true);
    } catch (e) {
      this.toastService.error(e['message'] ?? DEFAULT_WARNING_MESSAGE);
    } finally {
      this.loading = false;
    }
  }
}
