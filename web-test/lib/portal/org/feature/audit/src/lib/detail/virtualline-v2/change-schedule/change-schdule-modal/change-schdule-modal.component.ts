import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Shift } from '@b3networks/api/audit';

@Component({
  selector: 'poa-change-schdule-modal',
  templateUrl: './change-schdule-modal.component.html',
  styleUrls: ['./change-schdule-modal.component.scss']
})
export class ChangeSchduleModalComponent implements OnInit {
  columns = ['property', 'changes'];
  shifts: Shift[] = [];

  constructor(@Inject(MAT_DIALOG_DATA) private data, private dialogRef: MatDialogRef<ChangeSchduleModalComponent>) {}

  ngOnInit(): void {
    this.shifts = this.data.shifts;
  }

  onClose() {
    this.dialogRef.close();
  }
}
