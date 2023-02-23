import { Component, Input, OnInit } from '@angular/core';
import { TransactionsBalance } from '@b3networks/api/billing';

@Component({
  selector: 'b3n-transaction-details',
  templateUrl: './transaction-details.component.html',
  styleUrls: ['./transaction-details.component.scss']
})
export class TransactionDetailsComponent implements OnInit {
  displayedColumns = ['item', 'quanlity', 'amount'];

  @Input() items: TransactionsBalance[] = [];
  constructor() {}

  ngOnInit(): void {}
}
