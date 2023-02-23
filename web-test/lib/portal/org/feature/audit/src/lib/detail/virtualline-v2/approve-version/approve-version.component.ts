import { Component, Input, OnInit } from '@angular/core';

interface Approve {
  label: string;
  value: string;
}

@Component({
  selector: 'poa-approve-version',
  templateUrl: './approve-version.component.html',
  styleUrls: ['./approve-version.component.scss']
})
export class ApproveVersionComponent implements OnInit {
  columns = ['change', 'changeValue'];
  @Input('raw') raw: any;
  approves: Approve[] = [];

  constructor() {}

  ngOnInit(): void {
    const data: Approve[] = [
      {
        label: 'Version',
        value: this.raw.auditData.version
      },
      {
        label: 'Release note',
        value: this.raw.auditData.note
      },
      {
        label: 'Release note',
        value: this.raw.auditData.scheduleTime
      }
    ];
    this.approves = data;
  }
}
