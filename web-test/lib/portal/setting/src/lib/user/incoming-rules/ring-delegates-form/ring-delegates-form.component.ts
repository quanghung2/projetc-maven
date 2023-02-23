import { KeyValue } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Extension } from '@b3networks/api/bizphone';

@Component({
  selector: 'b3n-ring-delegates-form',
  templateUrl: './ring-delegates-form.component.html',
  styleUrls: ['./ring-delegates-form.component.scss']
})
export class RingDelegatesFormComponent implements OnInit {
  @Input() extension: Extension;

  readonly elapsedTimeOptions: KeyValue<number, string>[] = [
    { key: 5, value: '5' },
    { key: 15, value: '15' },
    { key: 30, value: '30' },
    { key: 45, value: '45' },
    { key: 60, value: '60' }
  ];
  constructor() {}

  ngOnInit() {}
}
