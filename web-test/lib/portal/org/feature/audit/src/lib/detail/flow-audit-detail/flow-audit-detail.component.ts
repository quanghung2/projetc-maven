import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'poa-flow-audit-detail',
  templateUrl: './flow-audit-detail.component.html',
  styleUrls: ['./flow-audit-detail.component.scss']
})
export class FlowAuditDetailComponent implements OnInit {
  columns = ['title', 'value'];
  @Input('rawData') rawData: any;
  constructor() {}

  ngOnInit(): void {}
}
