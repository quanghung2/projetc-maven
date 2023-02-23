import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { OtherService } from '@b3networks/api/cp';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-config-b3works-app-dialog',
  templateUrl: './config-b3works-app-dialog.component.html',
  styleUrls: ['./config-b3works-app-dialog.component.scss']
})
export class ConfigB3WorksAppDialogComponent implements OnInit {
  formConfig: UntypedFormGroup;
  setting: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public enable: boolean,
    private dialogRef: MatDialogRef<ConfigB3WorksAppDialogComponent>,
    private fb: UntypedFormBuilder,
    private otherService: OtherService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.formConfig = this.fb.group({
      orgUuid: ['', Validators.required],
      identityUuid: ['', Validators.required],
      enabled: this.enable
    });
  }

  setConfig() {
    if (this.formConfig.valid) {
      this.setting = true;
      this.otherService
        .toggleB3worksMode(this.formConfig.value)
        .pipe(finalize(() => (this.setting = false)))
        .subscribe(
          _ => {
            this.toastService.success(`${this.enable ? 'Enable' : 'Disable'} B3Works app successfully`);
            this.dialogRef.close();
          },
          err => this.toastService.error(err)
        );
    }
  }
}
