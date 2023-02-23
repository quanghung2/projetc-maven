import { KeyValue } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { GeneralUploadRes, S3Service, Status } from '@b3networks/api/file';
import { IpPhoneBrand, IPPhoneProvision, IpPhoneProvisionService } from '@b3networks/api/ipphoneprovisioning';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface CreateTemplateData {
  isDuplicate: boolean;
  itemCLone: IPPhoneProvision;
}

@Component({
  selector: 'b3n-create-template',
  templateUrl: './create-template.component.html',
  styleUrls: ['./create-template.component.scss']
})
export class CreateTemplateComponent implements OnInit {
  readonly brands: KeyValue<IpPhoneBrand, string>[] = [
    { key: IpPhoneBrand.yealink, value: 'Yealink' },
    { key: IpPhoneBrand.fanvil, value: 'Fanvil' }
  ];

  uploading: boolean;
  loading: boolean;
  formGroup: UntypedFormGroup;

  uploadResp: GeneralUploadRes;
  s3Key: string;
  nameFile: string;

  constructor(
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: CreateTemplateData,
    private dialogRef: MatDialogRef<CreateTemplateComponent>,
    private toastService: ToastService,
    private ipPhoneProvisionService: IpPhoneProvisionService,
    private s3Service: S3Service
  ) {
    if (data.isDuplicate) {
      this.formGroup = this.fb.group({
        brand: [{ value: data.itemCLone.brand, disabled: true }, Validators.required],
        model: ['', [Validators.required]],
        version: ['', [Validators.required]]
      });
    } else {
      this.formGroup = this.fb.group({
        brand: [IpPhoneBrand.yealink, [Validators.required]],
        model: ['', [Validators.required]],
        version: ['', [Validators.required]]
      });
    }
  }

  ngOnInit(): void {}

  create() {
    if (this.data.isDuplicate) {
      let req: IPPhoneProvision = this.formGroup.value as IPPhoneProvision;
      req = <IPPhoneProvision>{
        ...req,
        fromBrand: this.data.itemCLone.brand,
        fromModel: this.data.itemCLone.model
      };
      this.ipPhoneProvisionService.cloneTemplate(req).subscribe(_ => {
        this.toastService.success('Duplicate template successfully!');
        this.dialogRef.close(true);
      });
    } else {
      const req: IPPhoneProvision = this.formGroup.value as IPPhoneProvision;
      if (this.s3Key) {
        req.s3Key = this.s3Key;
      }
      this.ipPhoneProvisionService.createTemplate(req).subscribe(_ => {
        this.toastService.success('Create template successfully!');
        this.dialogRef.close(true);
      });
    }
  }

  removeFile() {
    this.s3Key = null;
    this.nameFile = null;
  }

  uploadFile(event) {
    this.uploadResp = <GeneralUploadRes>{ status: 'processing', percentage: 0 };
    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      this.uploading = true;
      this.s3Service.generalUpload(file, 'uploads', 'root-cp').subscribe(
        res => {
          this.uploadResp = res;
          if ([Status.COMPLETED, Status.CANCELED].includes(res.status)) {
            this.uploading = false;
          }
          if (res.status === Status.COMPLETED) {
            this.s3Key = res?.keyForSignApi;
            this.nameFile = file.name;
          }
        },
        err => {
          this.toastService.error(err.message);
        }
      );
    }
  }
}
