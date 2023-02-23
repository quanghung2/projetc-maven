import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Device, DeviceService, ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { finalize } from 'rxjs/operators';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-assign-device',
  templateUrl: './assign-device.component.html',
  styleUrls: ['./assign-device.component.scss']
})
export class AssignDeviceComponent implements OnInit {
  selectedDevice: Device;
  selectedExtension: ExtensionBase;
  progressing: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public devices: Device[],
    private deviceService: DeviceService,
    private extensionQuery: ExtensionQuery,
    private dialogRef: MatDialogRef<AssignDeviceComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    const extKey = this.extensionQuery.getActiveId();
    this.selectedExtension = this.extensionQuery.getEntity(extKey);
  }

  assign() {
    this.progressing = true;
    const device = {
      ...this.selectedDevice,
      ext: this.selectedExtension.extKey,
      extLabel: this.selectedExtension.extLabel,
      extType: this.selectedExtension.type
    } as Device;
    this.deviceService
      .updateDevice(device)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.dialogRef.close();
          this.toastService.success('Assigned successfully');
        },
        error => {
          this.toastService.error(error.message);
        }
      );
  }
}
