import { Injectable } from '@angular/core';

declare global {
  interface Navigator {
    msSaveBlob?: (blob: any, defaultName?: string) => boolean;
  }
}

@Injectable()
export class ExportService {
  constructor() {}

  exportCsv(content, fileName) {
    const a = document.createElement('a');
    const today = new Date();
    fileName = `${fileName}_${today.getDate()}_${today.getMonth() + 1}_${today.getFullYear()}.csv`;

    if (navigator['msSaveBlob']) {
      // IE10
      return navigator.msSaveBlob(new Blob([content], { type: 'text/csv' }), fileName);
    } else if ('download' in a) {
      //html5 A[download]
      a.href = 'data:text/csv' + ',' + encodeURIComponent(content);
      a.setAttribute('download', fileName);
      document.body.appendChild(a);
      setTimeout(function () {
        a.click();
        document.body.removeChild(a);
      }, 66);
      return true;
    } else {
      //do iframe dataURL download (old ch+FF):
      const f = document.createElement('iframe');
      document.body.appendChild(f);
      f.src = 'data:text/csv' + ',' + encodeURIComponent(content);

      setTimeout(function () {
        document.body.removeChild(f);
      }, 333);
      return true;
    }
  }
}
