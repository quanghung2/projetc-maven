import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MsTeamCallCenterService, TeamExtensionReq } from '@b3networks/api/callcenter';
import { FileService, S3Service } from '@b3networks/api/file';
import { getFileType } from '@b3networks/chat/shared/core';
import { DestroySubscriberComponent, humanFileSize } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import exportFromJSON from 'export-from-json';
import { from } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

interface JSONResponseFromCSV {
  properties: string[];
  data: Array<any>;
}

interface FailedRecord {
  key: string | string[];
  msTeamUsername: string;
  failedReason: string;
}

@Component({
  selector: 'pos-ms-mass-configuration-dialog',
  templateUrl: './mass-configuration-dialog.component.html',
  styleUrls: ['./mass-configuration-dialog.component.scss']
})
export class MassConfigurationDialogComponent extends DestroySubscriberComponent {
  progressPercentage = 0;
  isUploadingCSV = false;
  file: File;
  logoFileType: string;
  sizeFile: string;
  numberSuccessReq = 0;
  numberFailedReq = 0;
  failedRecords: FailedRecord[] = [];
  isConfigureCompleted = false;

  constructor(
    private toastService: ToastService,
    private s3Service: S3Service,
    private fileService: FileService,
    private msTeamCallCenterService: MsTeamCallCenterService,
    private dialogRef: MatDialogRef<MassConfigurationDialogComponent>
  ) {
    super();
  }

  uploadCSV(event) {
    if (event.target.files.length > 0) {
      this.file = event.target.files[0];
      this.logoFileType = getFileType(this.file.type);
      this.sizeFile = humanFileSize(this.file.size);
      this.isConfigureCompleted = false;
    }
  }

  configure() {
    const observable = from(this.convertCSVtoJSON(this.file));
    observable
      .pipe(
        map(({ data }) => {
          const mappingData: TeamExtensionReq[] = data
            .map(item => {
              if (!!item[Object.keys(item)[0]] && item[Object.keys(item)[0]].length <= 5) {
                return <TeamExtensionReq>{
                  extKey: item[Object.keys(item)[0]],
                  msTeamUsername: item[Object.keys(item)[1]]
                };
              }

              if (!!item[Object.keys(item)[0]] && item[Object.keys(item)[0]].length > 5) {
                return <TeamExtensionReq>{
                  ddi: [item[Object.keys(item)[0]]],
                  msTeamUsername: item[Object.keys(item)[1]]
                };
              }
              return null;
            })
            .filter(item => item && item.msTeamUsername && (item.extKey || item.ddi.length));
          mappingData.forEach(item => {
            if (!this.validateEmail(item.msTeamUsername)) {
              this.numberFailedReq++;
              this.failedRecords.push({
                key: item.extKey || item.ddi,
                msTeamUsername: item.msTeamUsername,
                failedReason: `${item.msTeamUsername} is not a valid email`
              });
            }
          });
          return mappingData.filter(item => this.validateEmail(item.msTeamUsername));
        })
      )
      .subscribe(
        data => {
          this.isUploadingCSV = true;
          const extKeys = data.filter(item => !!item.extKey).map(item => item.extKey);
          this.msTeamCallCenterService.checkDeviceExistence(extKeys).subscribe(response => {
            // this API remove duplicated extension key
            if (response) {
              for (const responseExtKey in response) {
                if (response.hasOwnProperty(responseExtKey)) {
                  const index = data.findIndex(item => item.extKey === responseExtKey);
                  if (response[responseExtKey] === false) {
                    this.numberFailedReq++;
                    this.failedRecords.push({
                      key: data[index].extKey,
                      msTeamUsername: data[index].msTeamUsername,
                      failedReason: `Extension ${responseExtKey} does not have available Microsoft Team device`
                    });
                    data = data.filter(item => item.extKey !== responseExtKey);
                  }
                }
              }
              if (data.length) {
                data.forEach((item, index) => {
                  this.updateMapping(data, index);
                });
              } else {
                this.finishConfigProcess();
              }
            }
          });
        },
        err => {
          this.toastService.error(err);
        }
      );
  }

  private finishConfigProcess() {
    this.progressPercentage = 100;
    this.isConfigureCompleted = true;
    this.isUploadingCSV = false;
  }

  private updateMapping(data: TeamExtensionReq[], index: number) {
    const body: TeamExtensionReq = {
      msTeamUsername: data[index].msTeamUsername,
      ddi: data[index].ddi,
      extKey: data[index].extKey
    };
    this.msTeamCallCenterService
      .updateExtension(body)
      .pipe(
        finalize(() => {
          if (index + 1 === data.length) {
            this.finishConfigProcess();
          } else {
            this.progressPercentage = ((index + 1) * 100) / data.length;
          }
        })
      )
      .subscribe(
        _ => {
          this.numberSuccessReq++;
        },
        err => {
          this.numberFailedReq++;
          this.failedRecords.push({
            key: data[index].extKey || data[index].ddi,
            msTeamUsername: data[index].msTeamUsername,
            failedReason: err && err.message ? err.message : err
          });
        }
      );
  }

  done() {
    this.dialogRef.close(true);
  }

  private validateEmail(email) {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  export() {
    const data = this.failedRecords.map(item => {
      item.key = item.key.toString();
      return item;
    });
    const fileName = 'ms_failed_records_download';
    const exportType = 'csv';

    exportFromJSON({ data, fileName, exportType });
  }

  private convertCSVtoJSON(file: File): Promise<JSONResponseFromCSV> {
    let csvContent: any;

    return new Promise((resolve, reject) => {
      if (file.size <= 50000) {
        const fileToRead = file;
        const fileReader = new FileReader();

        fileReader.onload = function (fileLoadedEvent) {
          csvContent = fileLoadedEvent.target.result;

          //Flag is for extracting first line
          let flag = false;
          // Main Data
          const objarray: Array<any> = [];
          //Properties
          const prop: Array<any> = [];
          //Total Length
          let size: any = 0;

          for (const line of csvContent.split(/[\r\n]+/)) {
            if (flag) {
              const obj = {};
              for (let k = 0; k < size; k++) {
                //Dynamic Object Properties
                obj[prop[k]] = line.split(',')[k];
              }
              objarray.push(obj);
            } else {
              //First Line of CSV will be having Properties
              for (let k = 0; k < line.split(',').length; k++) {
                size = line.split(',').length;
                //Removing all the spaces to make them usefull
                prop.push(line.split(',')[k].replace(/ /g, ''));
              }
              flag = true;
            }
          }

          resolve(<JSONResponseFromCSV>{
            properties: prop,
            data: objarray
          });
        };

        fileReader.readAsText(fileToRead, 'UTF-8');
      } else {
        reject('Exceeded the maximum file size (5MB)');
      }
    });
  }
}
