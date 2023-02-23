import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionService } from '@b3networks/api/callcenter';
import { CreateExtReq, License, LicenseService } from '@b3networks/api/license';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface UpdateExtDialogData {
  license: License;
  extension: ExtensionBase;
}

@Component({
  selector: 'b3n-update-extension',
  templateUrl: './update-extension.component.html',
  styleUrls: ['./update-extension.component.scss']
})
export class UpdateExtensionComponent implements OnInit {
  updating: boolean;

  form: UntypedFormGroup;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: UpdateExtDialogData,
    private extensionService: ExtensionService,
    private dialogRef: MatDialogRef<UpdateExtensionComponent>,
    private licenseService: LicenseService,
    private fb: UntypedFormBuilder,
    private toastService: ToastService
  ) {
    this.form = this.fb.group({
      extKey: [this.data.license.resource.key, [Validators.required, Validators.minLength(3), Validators.maxLength(5)]],
      extLabel: [this.data.extension.extLabel, [Validators.required, Validators.maxLength(100)]]
    });
  }

  ngOnInit(): void {}

  async update() {
    const newExtInfo = this.form.value as ExtensionBase;
    if (newExtInfo.extKey === this.data.extension.extKey && newExtInfo.extLabel === this.data.extension.extLabel) {
      this.toastService.warning('Nothing new to update');
      return;
    }

    this.updating = true;

    const result = { updatedKey: false, updated: false };
    try {
      if (newExtInfo.extKey !== this.data.license.resource.key) {
        await this.licenseService
          .updateResource(this.data.license.id, <CreateExtReq>{ extKey: newExtInfo.extKey }, 'extension')
          .toPromise();
        this.extensionService.syncExtensionKey(this.data.extension, newExtInfo.extKey); // to sync extension store with key changed from license
        result.updatedKey = true;
      }

      if (newExtInfo.extLabel !== this.data.extension.extLabel) {
        await this.extensionService.update(newExtInfo.extKey, { extLabel: newExtInfo.extLabel }).toPromise();
      }

      this.updating = false;

      result.updated = true;
      this.dialogRef.close(result);
      this.toastService.success('Updated successfully');
    } catch (error) {
      this.updating = false;
      this.toastService.error(error?.['message'] || 'Cannot update extension label. Please try again later');
    }
  }
}
