import { Component, Input, OnInit } from '@angular/core';
import { format } from 'date-fns';

@Component({
  selector: 'poa-ms-data-detail',
  templateUrl: './ms-data-detail.component.html',
  styleUrls: ['./ms-data-detail.component.scss']
})
export class MsDataDetailComponent implements OnInit {
  columns = ['field', 'value'];
  histories = [];
  @Input('rawData') rawData: any;

  constructor() {}

  ngOnInit(): void {
    this.report();
  }

  report() {
    const dataReport = this.rawData.auditData;
    this.histories = [
      { field: 'From', value: this.formatDateTime(dataReport.requestBody.startTime) },
      { field: 'To', value: this.formatDateTime(dataReport.requestBody.endTime) }
    ];
    if (dataReport.pathToken.period) {
      this.histories.push({ field: 'Period', value: dataReport.pathToken.period });
    }
  }

  formatDateTime(datetime) {
    return format(new Date(datetime), 'yyyy-MM-dd HH:mm');
  }
}
