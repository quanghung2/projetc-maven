import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConversationGroup, Privacy } from '@b3networks/api/workspace';

@Component({
  selector: 'csh-leave-convo',
  templateUrl: './leave-convo.component.html',
  styleUrls: ['./leave-convo.component.scss']
})
export class LeaveConvoComponent implements OnInit {
  readonly Privacy = Privacy;

  constructor(
    @Inject(MAT_DIALOG_DATA) public convo: ConversationGroup,
    private dialogRef: MatDialogRef<LeaveConvoComponent>
  ) {}

  ngOnInit() {}

  submit() {
    this.dialogRef.close(true);
  }
}
