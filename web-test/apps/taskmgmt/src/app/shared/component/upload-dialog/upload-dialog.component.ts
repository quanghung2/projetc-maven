import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AllowedExtension, MAX_FILE_SIZE } from '@b3networks/api/workspace';
import { getFileType } from '@b3networks/chat/shared/core';
import { getFileExtension, humanFileSize } from '@b3networks/shared/common';

@Component({
  selector: 'b3n-upload-dialog',
  templateUrl: './upload-dialog.component.html',
  styleUrls: ['./upload-dialog.component.scss']
})
export class UploadDialogComponent implements OnInit {
  readonly humanFileSize = humanFileSize;
  readonly getFileType = getFileType;
  readonly getFileExtension = getFileExtension;
  readonly allowedExtension = AllowedExtension;

  get isLargeFile() {
    return this.data.model[this.data.index]?.file.size > MAX_FILE_SIZE;
  }
  uploadPercentage: number;
  uploading: boolean;
  input: any;
  index = 0;
  model: any;
  dataResutl = [];

  constructor(private dialogRef: MatDialogRef<UploadDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.input = data;
  }
  ngOnInit(): void {
    this.model = this.data.model[this.index];
  }

  handleUploadFile() {
    this.uploading = true;
    const fileType = this.model.file.name.split('.')[this.model.file.name.split('.').length - 1];
    if (this.allowedExtension.includes(fileType)) {
      this.dataResutl.push({ file: this.model.file, index: this.index });
      if (this.index < this.data.max - 1) {
        this.index++;
        this.model = this.data.model[this.index];

        this.handleUploadFile();
      } else {
        this.dialogRef.close(this.dataResutl);
      }
    } else {
      console.log(`Can not upload ${fileType} file `);
      if (this.index < this.data.max - 1) {
        this.index++;
        this.model = this.data.model[this.index];

        this.handleUploadFile();
      } else {
        this.dialogRef.close(this.dataResutl);
      }
    }
  }
}
