import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'b3n-inbox-management',
  templateUrl: './inbox-management.component.html',
  styleUrls: ['./inbox-management.component.scss']
})
export class InboxManagementComponent implements OnInit {
  curTab: string;

  readonly tabs: KeyValue<string, string>[] = [
    // { key: 'inbox', value: 'Inbox' },
    // { key: 'routing-configuration', value: 'Routing Configuration' }
  ];

  constructor() {}

  ngOnInit(): void {}
}
