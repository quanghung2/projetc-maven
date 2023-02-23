import { Component, Input, OnInit } from '@angular/core';
import { ConditionBlock } from '@b3networks/api/ivr';

@Component({
  selector: 'b3n-condition',
  templateUrl: './condition.component.html',
  styleUrls: ['./condition.component.scss']
})
export class ConditionComponent implements OnInit {
  @Input() block: ConditionBlock = new ConditionBlock();

  constructor() {}

  ngOnInit() {}
}
