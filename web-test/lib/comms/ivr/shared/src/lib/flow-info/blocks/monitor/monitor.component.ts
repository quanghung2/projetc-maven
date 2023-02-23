import { Component, Input, OnInit } from '@angular/core';
import { MonitorBlock } from '@b3networks/api/ivr';

@Component({
  selector: 'b3n-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss']
})
export class MonitorComponent implements OnInit {
  @Input() block: MonitorBlock = new MonitorBlock();

  constructor() {}

  ngOnInit() {}
}
