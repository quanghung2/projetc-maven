import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Change } from '@b3networks/api/audit';

@Component({
  selector: 'poa-edit-callcenter-modal',
  templateUrl: './edit-callcenter-modal.component.html',
  styleUrls: ['./edit-callcenter-modal.component.scss']
})
export class EditCallcenterModalComponent implements OnInit {
  columns = ['property', 'changes'];
  changes: Change[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) private data: Change[],
    private dialogRef: MatDialogRef<EditCallcenterModalComponent>
  ) {}

  ngOnInit(): void {
    console.log(this.data);

    this.changes = this.data;
  }

  onClose() {
    this.dialogRef.close();
  }
}
