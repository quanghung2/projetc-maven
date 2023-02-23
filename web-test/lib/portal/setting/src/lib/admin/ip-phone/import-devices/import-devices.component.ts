import { Component, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DeviceService } from '@b3networks/api/bizphone';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-import-devices',
  templateUrl: './import-devices.component.html',
  styleUrls: ['./import-devices.component.scss']
})
export class ImportDevicesComponent implements OnInit {
  macAddress: UntypedFormControl = new UntypedFormControl('', [Validators.required]);

  importing: boolean;

  constructor(
    private deviceService: DeviceService,
    private dialogRef: MatDialogRef<ImportDevicesComponent>,
    private toastrService: ToastService
  ) {}

  ngOnInit(): void {}

  import() {
    const allTextLines = this.macAddress.value.split(/\r\n|\n/);
    let valid = true;
    const macs = allTextLines.map(s => {
      s = s.trim();
      if (s.length !== 12) {
        valid = false;
        this.toastrService.warning(`MAC addresses [${s}] are invalid! The format of MAC address must be 12 characters`);
        return;
      }
      return s.trim();
    });

    if (valid) {
      this.importing = true;
      this.deviceService
        .import(macs)
        .pipe(
          finalize(() => {
            this.importing = false;
          })
        )
        .subscribe(
          _ => {
            this.toastrService.success('Import MAC Addresses successfully');
            this.dialogRef.close();
          },
          err => {
            this.toastrService.error(err.message);
          }
        );
    }
  }
}
