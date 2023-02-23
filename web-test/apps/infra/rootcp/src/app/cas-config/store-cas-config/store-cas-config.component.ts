import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CASConfig, getStandardCasConfig, ResCASConfig } from '@b3networks/api/infra';
import { ToastService } from '@b3networks/shared/ui/toast';
import { ACTION_CAS_CONFIG, CAS_CONFIG } from '../cas-config.component';

export interface StoreCASConfigData {
  listData: ResCASConfig;
  appModule: CAS_CONFIG;
  currentData: CASConfig;
  action: ACTION_CAS_CONFIG;
}

@Component({
  selector: 'b3n-stort-cas-config',
  templateUrl: './store-cas-config.component.html',
  styleUrls: ['./store-cas-config.component.scss']
})
export class StoreCASConfigComponent implements OnInit {
  formGroup: UntypedFormGroup;
  readonly CAS_CONFIG = CAS_CONFIG;
  readonly ACTION_CAS_CONFIG = ACTION_CAS_CONFIG;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: StoreCASConfigData,
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<StoreCASConfigComponent>,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      key: [this.data.action === ACTION_CAS_CONFIG.Update ? this.data.currentData.key : '', [Validators.required]],
      value: [
        this.data.action === ACTION_CAS_CONFIG.Update
          ? getStandardCasConfig(this.data.currentData.value as ResCASConfig, this.data.appModule)
          : '',
        [Validators.required]
      ]
    });
  }

  submit() {
    if (this.data.action === ACTION_CAS_CONFIG.Update) {
      delete this.data.listData[this.data.currentData.key];
    }

    if (this.formGroup.invalid) return;

    if (!Object.keys(this.data.listData).includes(this.formGroup.value.key)) {
      let value: ResCASConfig;
      if (this.data.appModule === CAS_CONFIG.keyFilter) {
        value = this.formGroup.value.value.split('\n');
      } else {
        for (const key in this.data.listData) {
          try {
            value = JSON.parse(this.formGroup.value.value);
          } catch (e) {
            value = JSON.parse(JSON.stringify(this.formGroup.value.value));
          }
        }
      }

      const casModule = { [this.formGroup.value.key]: value };
      this.dialogRef.close(casModule);

      return;
    }

    this.toastService.warning(`App module ${this.formGroup.value.key} existed.`);
  }
}
