import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { B3Number } from '@b3networks/api/number';
import { convertToCSV, csvToArray, donwloadFromUrl } from '@b3networks/shared/common';
import { SkuInfo } from '../select-number/select-number.component';

export interface LoadNumberInput {
  skuInfo: SkuInfo;
}

@Component({
  selector: 'b3n-load-number',
  templateUrl: './load-number.component.html',
  styleUrls: ['./load-number.component.scss']
})
export class LoadNumberComponent implements OnInit {
  filename = 'Select file';
  numbers: string[] = [];

  uploading: boolean;

  @ViewChild('uploadFileInput') uploadFileInput: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: LoadNumberInput,
    private dialogRef: MatDialogRef<LoadNumberComponent>
  ) {}

  ngOnInit(): void {}

  uploadFileEvt(event) {
    if (event.target.files.length > 0) {
      const file = event.target.files[0] as File;
      this.filename = file.name;

      const reader = new FileReader();

      const self = this;
      reader.addEventListener('load', function (e) {
        const csvdata = e.target.result;
        self.numbers = csvToArray(csvdata as string).reduce((list, obj) => {
          list.push(...obj);
          return list;
        }, []);
      });

      reader.readAsBinaryString(file);
      this.uploadFileInput.nativeElement.value = '';
    } else {
      this.filename = 'Select file';
    }
  }

  downloadSample() {
    const csv = convertToCSV([['+6585555860']]);
    const uri = 'data:text/csv;charset=utf-8,' + escape(csv);
    donwloadFromUrl(uri, 'load_number_sample.csv');
  }

  update() {
    const result = this.numbers.map(n => {
      const number = n.startsWith('+') ? n : '+' + n;
      return new B3Number({ number: number, country: this.data.skuInfo.numberSku, sku: this.data.skuInfo.numberSku });
    });
    this.dialogRef.close(result);
  }
}
