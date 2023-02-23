import { Component, Input, OnInit } from '@angular/core';
import { AgileExtraParams, Integration } from 'libs/api/ivr/src/lib/integration/integration';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'b3n-agile-crm',
  templateUrl: './agile-crm.component.html',
  styleUrls: ['./agile-crm.component.scss']
})
export class AgileCRMComponent implements OnInit {
  readonly priorities: KeyValue<String, String>[] = [
    { key: 'LOW', value: 'Low' },
    { key: 'MEDIUM', value: 'Medium' },
    { key: 'HIGH', value: 'High' }
  ];

  readonly statuses: KeyValue<String, String>[] = [
    { key: 'NEW', value: 'New' },
    { key: 'OPEN', value: 'Open' },
    { key: 'PENDING', value: 'Pending' },
    { key: 'CLOSED', value: 'Closed' }
  ];

  @Input() integration: Integration;

  constructor() {}

  ngOnInit() {
    const extra = (this.integration.extra as AgileExtraParams) || <AgileExtraParams>{};

    this.integration.extra = <AgileExtraParams>{
      groupID: extra.groupID,
      priority: extra.priority,
      status: extra.status
    };
  }
}
