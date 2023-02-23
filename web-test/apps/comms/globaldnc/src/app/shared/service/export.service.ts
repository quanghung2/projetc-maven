import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {
  constructor() {}

  exportCsv(content, fileName) {
    var a = document.createElement('a');
    document.body.appendChild(a);

    let today = new Date();
    fileName = `${fileName}_${today.getDate()}_${today.getMonth()}_${today.getFullYear()}.csv`;

    var blob = new Blob([content], { type: 'octet/stream' }),
      url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
