import { Component, Input, OnInit } from '@angular/core';
import { Integration, ZenDeskExtraparams } from '@b3networks/api/ivr';
import { KeyValue } from '@angular/common';

@Component({
  selector: 'b3n-zen-desk',
  templateUrl: './zen-desk.component.html',
  styleUrls: ['./zen-desk.component.scss']
})
export class ZenDeskComponent implements OnInit {
  readonly priorities: KeyValue<String, String>[] = [
    { key: 'low', value: 'Low' },
    { key: 'normal', value: 'Normal' },
    { key: 'high', value: 'High' },
    { key: 'urgent', value: 'Urgent' }
  ];
  readonly statuses: KeyValue<String, String>[] = [
    { key: 'new', value: 'New' },
    { key: 'open', value: 'Open' },
    { key: 'pending', value: 'Pending' },
    { key: 'hold', value: 'Hold' },
    { key: 'solved', value: 'Solved' },
    { key: 'closed', value: 'Closed' }
  ];
  readonly types: KeyValue<String, String>[] = [
    { key: 'problem', value: 'Problem' },
    { key: 'incident', value: 'Incident' },
    { key: 'question', value: 'Question' },
    { key: 'task', value: 'Task' }
  ];
  @Input() integration: Integration;

  constructor() {}

  ngOnInit() {
    const extra = (this.integration.extra as ZenDeskExtraparams) || <ZenDeskExtraparams>{};
    this.integration.extra = <ZenDeskExtraparams>{
      type: extra.type,
      priority: extra.priority,
      status: extra.status
    };
  }
}
