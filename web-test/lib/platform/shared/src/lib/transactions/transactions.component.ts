import { Component, Input, OnInit } from '@angular/core';

export interface TransactionInput {
  sellerUuid: string;
  buyerUuid: string;
  timezone: string;
  currency: string;
}

@Component({
  selector: 'b3n-transactions',
  templateUrl: './transactions.component.html',
  styleUrls: ['./transactions.component.scss']
})
export class TransactionsComponent implements OnInit {
  @Input() data: TransactionInput;

  constructor() {}

  ngOnInit(): void {}
}
