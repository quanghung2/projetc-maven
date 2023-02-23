import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OrgConfig, OrgConfigService } from '@b3networks/api/callcenter';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface CallParkingConfigInput {
  orgConfig: OrgConfig;
  transferParkingTime: (parkingTime: number) => string;
  getTime: (
    parkingTime: number,
    unit: number
  ) => {
    prefix: string;
    time: number;
  };
}

@Component({
  selector: 'b3n-call-parking-config',
  templateUrl: './call-parking-config.component.html',
  styleUrls: ['./call-parking-config.component.scss']
})
export class CallParkingConfigComponent implements OnInit {
  form: UntypedFormGroup;
  saving: boolean;

  constructor(
    public dialogRef: MatDialogRef<CallParkingConfigComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CallParkingConfigInput,
    private fb: UntypedFormBuilder,
    private orgConfigService: OrgConfigService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm() {
    this.form = this.fb.group({
      prefix: [
        this.data.orgConfig.callParkingConfig.prefix,
        [Validators.required, Validators.minLength(2), Validators.maxLength(4)]
      ],
      parkingTime: [
        this.data.orgConfig.callParkingConfig.parkingtime,
        [Validators.required, Validators.min(300), Validators.max(14400)]
      ]
    });
  }

  save() {
    this.saving = true;
    this.orgConfigService
      .updateConfig({
        callParkingConfig: {
          prefix: this.form.controls['prefix'].value,
          parkingtime: this.form.controls['parkingTime'].value
        }
      })
      .pipe(finalize(() => (this.saving = false)))
      .subscribe(
        _ => {
          this.toastService.success(`Update call parking successfully`);
          this.dialogRef.close();
        },
        err => this.toastService.warning(err.message)
      );
  }

  get parkingTime() {
    return this.form.controls['parkingTime'];
  }

  get prefix() {
    return this.form.controls['prefix'];
  }
}
