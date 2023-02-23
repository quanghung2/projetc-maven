import { Injectable } from '@angular/core';
import { downloadData } from '@b3networks/shared/common';

@Injectable({ providedIn: 'root' })
export class SampleFileService {
  sampleCSVFile() {
    return ['+6512345678', '+6523456789', '+6511122233'].join('\n');
  }

  downloadSampleCSVFile() {
    const data = this.sampleCSVFile();
    downloadData(new Blob(['\ufeff', data]), 'sample-csv.csv');
  }
}
