import { Component, Input, OnInit } from '@angular/core';
import { ChangeNumbers } from '@b3networks/api/audit';

@Component({
  selector: 'poa-change-numbers',
  templateUrl: './change-numbers.component.html',
  styleUrls: ['./change-numbers.component.scss']
})
export class ChangeNumbersComponent implements OnInit {
  columns = ['ipaddress', 'ipaddressValue', 'change', 'changeValue'];
  @Input('raw') raw: any;
  public changeNumber: ChangeNumbers;
  constructor() {}

  ngOnInit(): void {
    this.changeNumber = new ChangeNumbers();
    if (this.raw.clientInfo) {
      this.changeNumber.ipAddress = this.raw.clientInfo.ipAddress;
    }
    this.changeNumber.numbers = this.raw.auditData.numbers;
    this.changeNumber.action = this.changeNumber.numbers ? 'Assign numbers' : 'Unassign numbers';
  }
}
