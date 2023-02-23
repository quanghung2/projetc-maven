import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'pop-credit-limit-modal',
  templateUrl: './credit-limit-modal.component.html',
  styleUrls: ['./credit-limit-modal.component.scss']
})
export class CreditLimitModalComponent implements OnInit {
  tempCreditLimitExpiryDate: string;
  constructor(@Inject(MAT_DIALOG_DATA) private data, private dialogRef: MatDialogRef<CreditLimitModalComponent>) {}

  ngOnInit(): void {
    this.tempCreditLimitExpiryDate = this.data;
  }

  close() {
    this.dialogRef.close();
  }
}
