import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Device, DeviceService, ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-edit-device',
  templateUrl: './edit-device.component.html',
  styleUrls: ['./edit-device.component.scss']
})
export class EditDeviceComponent implements OnInit {
  device: Device;
  unassign: boolean;
  searchExtensionForm: UntypedFormControl;
  deviceFg: UntypedFormGroup;
  updating: boolean;

  extensions$: Observable<ExtensionBase[]>;
  viewPassword: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) device: Device,
    private deviceService: DeviceService,
    private extensionQuery: ExtensionQuery,
    private dialogRef: MatDialogRef<EditDeviceComponent>,
    private toastr: ToastService,
    private fb: UntypedFormBuilder
  ) {
    this.device = device;
  }

  ngOnInit(): void {
    this.extensions$ = this.extensionQuery.selectAll().pipe(
      tap(extensions => {
        this.initForm(extensions);
      })
    );
  }

  update() {
    this.updating = true;

    const { name, ext, securityPassword } = this.deviceFg.value;
    const { extKey, extLabel, type } = ext;
    const body: Device = { ...this.device, ext: extKey, extType: type, extLabel: extLabel, name, securityPassword };

    this.deviceService
      .updateDevice(body)
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(
        _ => {
          this.dialogRef.close();
          this.toastr.success('Update device successfully');
        },
        error => {
          this.toastr.warning(error.message);
        }
      );
  }

  private initForm(extensions: ExtensionBase[]) {
    if (this.device) {
      this.deviceFg = this.fb.group({
        name: this.fb.control(this.device.name, [Validators.required]),
        ext: this.fb.control(
          extensions.find(e => e.extKey === this.device.ext),
          [Validators.required]
        ),
        securityPassword: this.fb.control(this.device.securityPassword ?? '')
      });
    }
  }
}
