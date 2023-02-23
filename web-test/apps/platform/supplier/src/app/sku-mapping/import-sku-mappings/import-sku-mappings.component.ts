import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { S3Service, Status } from '@b3networks/api/file';
import { SkuMappingService } from '@b3networks/api/supplier';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'pom-import-sku-mappings',
  templateUrl: './import-sku-mappings.component.html',
  styleUrls: ['./import-sku-mappings.component.scss']
})
export class ImportSkuMappingsComponent implements OnInit {
  tempKey: string;
  fileName: string;
  uploadFileProgress = 0;
  progressing: boolean;
  uploading: boolean;

  constructor(
    private s3Service: S3Service,
    private skuMappingService: SkuMappingService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<ImportSkuMappingsComponent>
  ) {}

  ngOnInit() {}

  selectCsvFile(event) {
    this.progressing = true;
    if (event.target.files.length > 0) {
      const file = event.target.files[0];

      this.s3Service
        .tempUpload(file)
        .pipe(finalize(() => (this.progressing = false)))
        .subscribe(
          res => {
            if (res.status === Status.PROCESSING) {
              this.uploadFileProgress = res.percentage;
            }
            if (res.status === Status.COMPLETED) {
              this.fileName = file.name;
              this.tempKey = res.tempKey;
            }
          },
          error => {
            this.toastService.error(
              error.message || 'The file could not be uploaded. Please try again in a few minutes'
            );
          }
        );
    }
  }

  uploadFile() {
    this.uploading = true;

    const importMappingRequest = {
      s3Key: this.tempKey
    };

    this.skuMappingService
      .import(importMappingRequest)
      .pipe(finalize(() => (this.uploading = false)))
      .subscribe(
        _ => {
          this.toastService.success('Uploaded successfully.');
          this.dialogRef.close(true);
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}
