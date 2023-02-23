import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ExtensionService } from '@b3networks/api/callcenter';
import { S3Service, Status } from '@b3networks/api/file';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-import-csv',
  templateUrl: './import-csv.component.html',
  styleUrls: ['./import-csv.component.scss']
})
export class ImportCsvComponent {
  tempKey: string;
  fileName: string;
  uploadFileProgress = 0;
  progressing: boolean;
  uploading: boolean;
  constructor(
    private s3Service: S3Service,
    private extensionService: ExtensionService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<ImportCsvComponent>
  ) {}

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

    this.extensionService
      .import(this.tempKey)
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
