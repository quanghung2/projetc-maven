import { Component, Input, OnInit } from '@angular/core';
import { TransferBlock } from '@b3networks/api/ivr';

@Component({
  selector: 'b3n-miss-transfer',
  templateUrl: './miss-transfer.component.html',
  styleUrls: ['./miss-transfer.component.scss']
})
export class MissTransferComponent implements OnInit {
  @Input() block: TransferBlock;

  constructor() {}

  ngOnInit() {}
}
