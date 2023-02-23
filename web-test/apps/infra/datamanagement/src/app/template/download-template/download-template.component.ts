import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Template, TemplateService } from '@b3networks/api/data';
import { DestroySubscriberComponent, downloadData, getFilenameFromHeader } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { endOfDay, startOfDay, subDays } from 'date-fns';
import { format } from 'date-fns-tz';

@Component({
  selector: 'b3n-download-template',
  templateUrl: './download-template.component.html',
  styleUrls: ['./download-template.component.scss']
})
export class DownloadReportComponent extends DestroySubscriberComponent implements OnInit {
  statusCode = '';
  responseData: any = [];
  templateReport: Template;
  timeZone = '+00:00';
  body: any;
  valueDefault = {
    startTime: format(subDays(startOfDay(new Date()), 7), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: this.timeZone
    }),
    endTime: format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ssxxx", {
      timeZone: this.timeZone
    }),
    orgUuid: '9d336117-63e5-412e-96ca-fa5f5627b4ac'
  };

  constructor(
    @Inject(MAT_DIALOG_DATA) public template: Template,
    public dialogRef: MatDialogRef<DownloadReportComponent>,
    private templateService: TemplateService,
    private toastService: ToastService
  ) {
    super();
    if (template) {
      this.templateReport = template;
      this.body = JSON.stringify(this.valueDefault, null, '\t');
    }
  }

  ngOnInit(): void {}

  downloadTemplate() {
    let body = JSON.parse(this.body);
    this.templateService.downloadReport(this.templateReport, body).subscribe(
      response => {
        downloadData(
          new Blob([response.body], { type: 'text/csv;charset=utf-8;' }),
          getFilenameFromHeader(response.headers)
        );
        this.dialogRef.close(true);
      },
      error => {
        this.toastService.error(error.message || 'Cannot download report. Please try again later.');
      }
    );
  }

  isJson(str) {
    try {
      return JSON.parse(str);
    } catch (e) {
      return false;
    }
  }
}
