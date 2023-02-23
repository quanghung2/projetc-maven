import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RoutingConfigSip, SipAccount, SipTrunkService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, downloadData } from '@b3networks/shared/common';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { InfoCSV } from '../upload-bulk-routing/upload-bulk-routing.component';

export interface ReportUploadData {
  result: InfoCSV[];
  sip: SipAccount;
}

export interface ReportData {
  lines: number;
  success: number;
  fail: number;
  dataFail: Array<InfoCSV>;
}

@Component({
  selector: 'b3n-report-upload',
  templateUrl: './report-upload.component.html',
  styleUrls: ['./report-upload.component.scss']
})
export class ReportUploadComponent extends DestroySubscriberComponent implements OnInit {
  report: ReportData = {
    lines: 0,
    success: 0,
    fail: 0,
    dataFail: []
  };
  isDone: boolean;
  formatSIP: RegExp = /^sip[a-zA-Z0-9][a-zA-Z0-9_\.]{0,32}@[a-zA-Z0-9]{1,32}(\.[a-zA-Z0-9]{1,32}){1,32}$/gi;

  constructor(
    public dialogRef: MatDialogRef<ReportUploadComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: ReportUploadData,
    public dialog: MatDialog,
    private sipTrunkService: SipTrunkService
  ) {
    super();
    this.bulkProgress(this.data.result);
  }

  ngOnInit() {}

  download() {
    let data = 'number,type,value,description\n';
    data += this.report.dataFail
      ?.map(item => `${item.number || ''},${item.type || ''},${item.value || ''},${item.description || ''}`)
      .join('\n');
    downloadData(new Blob(['\ufeff', data]), `report-fail-${new Date().getTime()}.csv`);
  }

  private async bulkProgress(result: InfoCSV[]) {
    console.log('result: ', result);
    result.forEach(async (item: InfoCSV) => {
      if (!item.number) {
        this.report.fail++;
        this.report.dataFail.push({
          ...item,
          description: `Number is required`
        });
        return;
      }

      if (!this.isNumeric(item.number)) {
        this.report.fail++;
        this.report.dataFail.push({
          ...item,
          description: `Error format number`
        });
        return;
      }

      if (!item.type) {
        this.report.fail++;
        this.report.dataFail.push({
          ...item,
          description: `type is required!. Use ext | number | sip`
        });
        return;
      }
      if (!item.value) {
        this.report.fail++;
        this.report.dataFail.push({
          ...item,
          description: `Forward To is required`
        });
        return;
      }

      const req = <RoutingConfigSip>{
        number: item.number
      };
      if (item.type === 'ext') {
        req.forwardTo = 'ext:' + item.value;
      } else if (item.type === 'sip') {
        req.forwardTo = item.value
          ?.split(';')
          ?.map(x => x?.trim())
          .filter(x => {
            if (!!x && x.match(this.formatSIP)) {
              return true;
            }
            this.report.fail++;
            this.report.dataFail.push({
              ...item,
              value: x,
              description: `Error format. Ex: sip1234567@abc.xyz!`
            });
            return false;
          })
          ?.map(x => 'sip:' + x)
          ?.join(', ');
      } else {
        req.forwardTo = item.value;
      }

      await this.sipTrunkService
        .createRoutingConfig(this.data.sip.sipUsername, req)
        .pipe(
          catchError(err => {
            return throwError(err);
          })
        )
        .subscribe(
          _ => {
            this.report.success++;
          },
          err => {
            if (item.type === 'sip') {
              const split = req.forwardTo.split(', ');
              split.forEach(value => {
                this.report.fail++;
                this.report.dataFail.push({
                  ...item,
                  value: value,
                  description: `${err.message}`
                });
              });
            } else {
              this.report.fail++;
              this.report.dataFail.push({
                ...item,
                description: `${err.message}`
              });
            }
          }
        );
    });
    this.isDone = true;
  }

  private isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
}
