import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddReq, MsgType, PrivateNoteService } from '@b3networks/api/workspace';

@Component({
  selector: 'csl-add-private-note',
  templateUrl: './add-private-note.component.html',
  styleUrls: ['./add-private-note.component.scss']
})
export class AddPrivateNoteComponent implements OnInit {
  processing: boolean;

  message: string;
  error: string;

  constructor(
    private privateNoteService: PrivateNoteService,
    private dialogRef: MatDialogRef<AddPrivateNoteComponent>,
    @Inject(MAT_DIALOG_DATA) public conversationGroupId: string
  ) {}

  ngOnInit() {}

  submit() {
    if (this.message) {
      this.error = null;
      this.processing = true;
      this.privateNoteService.add(this.conversationGroupId, new AddReq(this.message, MsgType.message)).subscribe(
        _ => {
          this.processing = false;
          this.dialogRef.close({ success: true, message: this.message });
        },
        error => {
          this.error = error;
          this.processing = false;
        }
      );
    }
  }
}
