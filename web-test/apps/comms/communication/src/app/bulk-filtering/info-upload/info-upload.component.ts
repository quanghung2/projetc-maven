import { Component, Inject, OnInit } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { downloadData, MyErrorStateMatcher } from '@b3networks/shared/common';
import { uniq } from 'lodash';

export interface InfoUploadInput {
  numbers: string[];
}

@Component({
  selector: 'b3n-info-upload',
  templateUrl: './info-upload.component.html',
  styleUrls: ['./info-upload.component.scss']
})
export class InfoUploadComponent implements OnInit {
  ctrl = new FormControl(null, [Validators.email]);
  matcher = new MyErrorStateMatcher();
  ui = {
    tottal: 0,
    valid: 0,
    invalid: 0,
    duplicate: 0
  };
  listValid: string[] = [];
  listInvalid: string[] = [];

  constructor(
    private dialogRef: MatDialogRef<InfoUploadComponent>,
    @Inject(MAT_DIALOG_DATA) private data: InfoUploadInput
  ) {}

  ngOnInit(): void {
    const array = this.data.numbers?.map(x => x?.replace(/(?:\\[rn]|[\r\n]+)+/g, '')?.trim())?.filter(x => !!x);
    this.ui.tottal = array?.length;
    const valid = array?.filter(x => x.length <= 16);
    this.listInvalid = array?.filter(x => x.length > 16);
    this.listValid = uniq(valid);
    this.ui.valid = this.listValid.length;
    this.ui.invalid = this.listInvalid.length;
    this.ui.duplicate = this.ui.tottal - this.ui.valid - this.ui.invalid;
  }

  download() {
    const data = this.listInvalid?.join('\n');
    downloadData(new Blob(['\ufeff', data]), `invalid-numbers-${new Date().getTime()}.csv`);
  }

  done() {
    this.dialogRef.close({
      email: this.ctrl.value,
      numbers: this.listValid
    });
  }
}
