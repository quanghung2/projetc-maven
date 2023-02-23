import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ConversationGroup } from '@b3networks/api/workspace';

export interface ArchiveConversationData {
  text: 'archive' | 'reopen',
  conversationGroup: ConversationGroup
}

@Component({
  selector: 'b3n-archive-conversation',
  templateUrl: './archive-conversation.component.html',
  styleUrls: ['./archive-conversation.component.scss']
})

export class ArchiveConversationComponent {
  constructor(
    public dialogRef: MatDialogRef<ArchiveConversationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ArchiveConversationData
  ) {
  }

  submit() {
    this.dialogRef.close(true);
  }
}
