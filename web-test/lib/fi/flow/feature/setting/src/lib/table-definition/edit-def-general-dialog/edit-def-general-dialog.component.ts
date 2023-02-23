import { Component, Inject, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { S3Service, Status } from '@b3networks/api/file';
import { AuthorActionDef, AuthorService, AuthorTriggerDef, GroupType, UpdateDefGeneral } from '@b3networks/api/flow';
import { Utils, ValidateStringMaxLength } from '@b3networks/fi/flow/shared';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

export interface EditDefGeneralDialogInput {
  type: GroupType;
  def: AuthorTriggerDef | AuthorActionDef;
  connectorUuid: string;
  isShowVisibility: boolean;
}

@Component({
  selector: 'b3n-edit-def-general',
  templateUrl: './edit-def-general-dialog.component.html',
  styleUrls: ['./edit-def-general-dialog.component.scss']
})
export class EditDefGeneralDialogComponent implements OnInit {
  formGroup: UntypedFormGroup;
  isLoading: boolean;
  uploading: boolean;

  getErrorInput(ctrl: UntypedFormControl | AbstractControl) {
    return Utils.getErrorInput(ctrl);
  }

  get iconUrl(): UntypedFormControl {
    return this.formGroup.get('iconUrl') as UntypedFormControl;
  }
  get name(): UntypedFormControl {
    return this.formGroup.get('name') as UntypedFormControl;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: EditDefGeneralDialogInput,
    private dialogRef: MatDialogRef<EditDefGeneralDialogComponent>,
    private fb: UntypedFormBuilder,
    private s3Service: S3Service,
    private authorService: AuthorService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      iconUrl: this.data.def.iconUrl,
      name: [
        this.data.def.name,
        Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
      ],
      description: [
        this.data.def.description,
        Utils.validateInput({ required: false, dataType: 'string', maxlength: ValidateStringMaxLength.DESCRIPTION })
      ],
      domainVisibility: this.fb.group({
        visibility: [
          {
            value: this.data.def.domainVisibility?.visibility,
            disabled: this.data.def.domainVisibility?.visibilityInherit
          }
        ],
        accessibleUsers: this.fb.array(this.createValueOrgToEdit(this.data.def.domainVisibility?.accessibleUsers)),
        visibilityInherit: this.data.def.domainVisibility?.visibilityInherit
      })
    });
  }

  private isValidFileType(file: { name: string; type: string }) {
    const typeAllow = ['jpg', 'jpeg', 'png', 'ico'];
    return file.type.startsWith('image/') && typeAllow.includes(file.type.split('/')[1]);
  }

  onFileChange(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0];
      if (!this.isValidFileType(file)) {
        return;
      }

      this.uploading = true;
      this.s3Service
        .directUploadPublicAsset(file, 'flowicon')
        .pipe(finalize(() => (this.uploading = false)))
        .subscribe({
          next: res => {
            if (res.status === Status.COMPLETED) {
              this.iconUrl.setValue(res.publicUrl);
            }
          },
          error: err => this.toastService.error(err.message)
        });
    }
  }

  onUpdate() {
    const body = <UpdateDefGeneral>this.formGroup.getRawValue();
    if (!this.data.isShowVisibility) {
      body.domainVisibility = null;
    }

    if (this.data.type === GroupType.ACTION) {
      this.isLoading = true;
      this.authorService
        .updateActionDefGeneral(this.data.connectorUuid, this.data.def.uuid, body)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => this.dialogRef.close({ success: true }),
          error: err => this.toastService.error(err.message)
        });
    }
    if (this.data.type === GroupType.EVENT) {
      this.isLoading = true;
      this.authorService
        .updateTriggerDefGeneral(this.data.connectorUuid, this.data.def.uuid, body)
        .pipe(finalize(() => (this.isLoading = false)))
        .subscribe({
          next: () => this.dialogRef.close({ success: true }),
          error: err => this.toastService.error(err.message)
        });
    }
  }

  private createValueOrgToEdit(arrStr: string[]): UntypedFormControl[] {
    const result: UntypedFormControl[] = [];
    arrStr.forEach(str => {
      result.push(
        new UntypedFormControl(
          str,
          Utils.validateInput({ required: true, dataType: 'string', maxlength: ValidateStringMaxLength.NAME_TITLE })
        )
      );
    });
    return result;
  }
}
