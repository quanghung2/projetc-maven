import { KeyValue } from '@angular/common';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'b3n-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  tabs: KeyValue<string, string>[] = [
    // { key: 'workflows', value: 'Workflows' },
    // { key: 'flows', value: 'Call Flows' },
    // { key: 'settings', value: 'Settings' }
  ];

  constructor() {}

  ngOnInit() {}
}
