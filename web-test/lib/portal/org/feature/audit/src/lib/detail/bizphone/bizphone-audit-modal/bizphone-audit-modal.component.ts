import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'poa-bizphone-audit-modal',
  templateUrl: './bizphone-audit-modal.component.html',
  styleUrls: ['./bizphone-audit-modal.component.scss']
})
export class BizphoneAuditModalComponent implements OnInit {
  displayedColumns = ['property', 'changes'];
  histories = [];
  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<BizphoneAuditModalComponent>) {}

  ngOnInit(): void {
    this.histories = this.data;
  }
  onClose() {
    this.dialogRef.close();
  }
}
