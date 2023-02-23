import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChatMessage } from '@b3networks/api/workspace';
import { ConfigMessageOption } from '../chat-message.component';
@Component({
  selector: 'csh-delete-message',
  templateUrl: './delete-message.component.html',
  styleUrls: ['./delete-message.component.scss']
})
export class DeleteMessageComponent implements OnInit {
  configMessageOption: ConfigMessageOption = {
    isHideAction: true
  };

  constructor(
    private dialogRef: MatDialogRef<DeleteMessageComponent>,
    @Inject(MAT_DIALOG_DATA) public message: ChatMessage
  ) {}

  ngOnInit() {}

  delete() {
    this.dialogRef.close({ isConfirm: true });
  }
}
