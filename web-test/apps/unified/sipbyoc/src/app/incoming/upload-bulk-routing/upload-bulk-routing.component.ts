import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { SipAccount } from '@b3networks/api/callcenter';
import { downloadData } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';

export interface InfoCSV {
  number: string;
  type: 'ext' | 'number' | 'sip';
  value: string;
  description?: string;
}

@Component({
  selector: 'b3n-upload-bulk-routing',
  templateUrl: './upload-bulk-routing.component.html',
  styleUrls: ['./upload-bulk-routing.component.scss']
})
export class UploadBulkRoutingComponent implements OnInit {
  @Input() sip: SipAccount;

  @Output() uploadDoneEvent = new EventEmitter<boolean>();
  @Output() onData = new EventEmitter<InfoCSV[]>();

  disableUploaderReason: string;
  backgroundUploading = false;
  uploadFileProgress = 0;
  uploadFileName: string;
  isDisableUploader: boolean;

  constructor(private toastService: ToastService) {}

  ngOnInit() {}

  downloadSampleFileService() {
    // const data =
    //   'number,type,value\n1111,ext,1234\n2222,sip,sip1@abc.xyz\n2222,sip,1@abc.xyz\n2222,sip,sip2@abc.xyz\n2222,sip,sip3@abc.xyz\n2222,sip,sip4@abc.xyz\n3333,number,+6512345678';
    const data = 'number,type,value\n1111,ext,1234';
    downloadData(new Blob(['\ufeff', data]), 'sample-bulk.csv');
  }

  onBackgroundFileChange(event) {
    let uploadedFile = null;
    if (event.target.files.length > 0) {
      uploadedFile = event.target.files[0];
    }

    if (event.target.files.length > 0) {
      this.backgroundUploading = true;

      try {
        const reader = new FileReader();
        reader.readAsText(uploadedFile);
        reader.onload = e => {
          const csv = reader.result;
          const lines = (csv as string)?.split('\n');
          let result: InfoCSV[] = [];
          const headers = lines[0].split(',')?.map(x =>
            x
              ?.toLowerCase()
              ?.replace(/(?:\\[rn]|[\r\n]+)+/g, '')
              ?.trim()
          );
          for (let i = 1; i < lines.length; i++) {
            let obj = <InfoCSV>{};
            const currentline = lines[i].split(',');
            const findIndex = result.findIndex(
              item => (<InfoCSV>item).number === currentline[0] && (<InfoCSV>item).type === currentline[1]
            );
            if (currentline[1] === 'sip' && findIndex > -1) {
              obj = { ...result[findIndex] };
              const value = currentline[2]?.replace(/(?:\\[rn]|[\r\n]+)+/g, '')?.trim();
              obj[headers[2]] += '; ' + value;
              result[findIndex] = obj;
            } else {
              for (let j = 0; j < headers.length; j++) {
                const value = currentline[j]?.replace(/(?:\\[rn]|[\r\n]+)+/g, '')?.trim();
                obj[headers[j]] = value;
              }
              result.push(obj);
            }
          }

          result = result.filter(item => !!item.number || !!item.type || !!item.value);
          this.onData.emit(result);
          this.backgroundUploading = false;
        };
        reader.onerror = () => {
          this.toastService.error('Unable to read ' + uploadedFile.fileName);
        };
      } catch (error) {
        this.toastService.error(error);
        this.backgroundUploading = false;
      }
    }
  }
}
