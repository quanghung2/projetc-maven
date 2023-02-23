import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Extension, ExtensionBase } from '@b3networks/api/bizphone';
import { ExtensionService } from '@b3networks/api/callcenter';
import { CreateExtReq, GetLicenseReq, License, LicenseService } from '@b3networks/api/license';
import { ToastService } from '@b3networks/shared/ui/toast';
import { of } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';

export interface UpdateExtDialogData {
  extension: Extension;
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
      extKey: [this.data.extension.extKey, [Validators.required, Validators.minLength(3), Validators.maxLength(5)]],
      extLabel: [this.data.extension.extLabel, [Validators.required]]
    });
    console.log(this.form.value);
  }

  ngOnInit(): void {}

  updateExt() {
    const data = this.form.value as ExtensionBase;
    data.extKey !== this.data.extension.extKey
      ? this.updateExtKeyAndExtLabel(data)
      : data.extLabel !== this.data.extension.extLabel
      ? this.updateExtLabel(data)
      : this.toastService.warning('Nothing new to update');
  }

  updateExtLabel(newExtInfo: Partial<ExtensionBase>) {
    this.updating = true;
    this.extensionService
      .update(newExtInfo.extKey, { extLabel: newExtInfo.extLabel })
      .pipe(finalize(() => (this.updating = false)))
      .subscribe(
        _ => {
          this.dialogRef.close({ status: 'ok' });
          this.toastService.success('Updated successfully');
        },
        error => {
          this.toastService.error(error.message || 'Cannot update extension label. Please try again later');
        }
      );
  }

  updateExtKeyAndExtLabel(newExtInfo: Partial<ExtensionBase>) {
    this.updating = true;
    this.licenseService
      .getLicenses(<GetLicenseReq>{ resourceKey: this.data.extension.extKey })
      .pipe(
        map(page => (page.content.length ? page.content[0] : null)),
        switchMap((license: License) => {
          return license
            ? this.licenseService.updateResource(license.id, <CreateExtReq>{ extKey: newExtInfo.extKey }, 'extension')
            : of();
        })
      )
      .subscribe(
        _ => {
          this.extensionService.syncExtensionKey(this.data.extension, newExtInfo.extKey);
          this.extensionService.setActive(newExtInfo.extKey);

          newExtInfo.extLabel !== this.data.extension.extLabel
            ? this.updateExtLabel(newExtInfo)
            : this.showSuccessfulToastAndCloseDialog();
        },
        err => {
          this.updating = false;
          this.toastService.error(err.message || 'Cannot update extension key. Please try again later');
        }
      );
  }

  showSuccessfulToastAndCloseDialog() {
    this.updating = false;
    this.dialogRef.close({ status: 'ok' });
    this.toastService.success('Updated extension key successfully');
  }
}
