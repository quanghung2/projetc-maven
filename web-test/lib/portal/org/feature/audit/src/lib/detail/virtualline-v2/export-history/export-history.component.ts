import { Component, Input, OnInit } from '@angular/core';

interface History {
  label: string;
  value: string;
}

@Component({
  selector: 'poa-export-history',
  templateUrl: './export-history.component.html',
  styleUrls: ['./export-history.component.scss']
})
export class ExportHistoryComponent implements OnInit {
  columns = ['history', 'valueHistory'];
  @Input('raw') raw: any;

  historys: History[] = [];

  constructor() {}

  ngOnInit(): void {
    const data: History[] = [
      {
        label: 'Date range',
        value: 'between ' + this.raw.auditData.fromDate + ' and ' + this.raw.auditData.toDate
      },
      {
        label: 'Query',
        value: this.raw.auditData.query
      },
      {
        label: 'Custom emails',
        value: this.raw.auditData.emails
      }
    ];

    this.historys = data;
  }
}
