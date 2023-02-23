import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TransactionInput } from '@b3networks/platform/shared';

@Component({
  selector: 'b3n-transaction-dialog',
  templateUrl: './transaction-dialog.component.html',
  styleUrls: ['./transaction-dialog.component.scss']
})
export class TransactionDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: TransactionInput) {}

  ngOnInit() {}
}
