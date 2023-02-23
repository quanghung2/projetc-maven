import { Injectable } from '@angular/core';
import { downloadData } from '@b3networks/shared/common';

@Injectable({ providedIn: 'root' })
export class SampleFileService {
  sampleCSVFile() {
    return 'number \n +6512345678';
  }

  downloadSampleNumberListCSVFile() {
    const data = this.sampleCSVFile();
    downloadData(new Blob(['\ufeff', data]), 'sample-csv.csv');
  }

  downloadTemplateCSVFile() {
    const data = '+6581234567\n+6596918851\n+84123456789\n+96918851\n123456';
    downloadData(new Blob(['\ufeff', data]), 'sample-csv.csv');
  }

  downloadSampleContactListCSVFile() {
    const data = 'name,number\ncontactA,+6512345678';
    downloadData(new Blob(['\ufeff', data]), 'sample-csv.csv');
  }

  downloadSampleConsentCSVFile() {
    const data = `Destination,Voice Status,Fax Status,Sms Status\n+6512345678,blacklist,whitelist,whitelist`;
    downloadData(new Blob(['\ufeff', data]), 'sample-consent.csv');
  }
}
