import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Change } from '@b3networks/api/audit';

@Component({
  selector: 'poa-audit-modal',
  templateUrl: './audit-modal.component.html',
  styleUrls: ['./audit-modal.component.scss']
})
export class AuditModalComponent implements OnInit {
  displayedColumns = ['property', 'changes'];
  changes: Change[] = [];
  action: string;
  mapAction: any;
  constructor(@Inject(MAT_DIALOG_DATA) private data, private dialogRef: MatDialogRef<AuditModalComponent>) {}

  ngOnInit(): void {
    this.changes = this.data.details;
    this.action = this.data.action;
    this.mapAction = this.data.mapAction;
  }

  onClose() {
    this.dialogRef.close();
  }
}
