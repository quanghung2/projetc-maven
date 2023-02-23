import { Component, Inject } from '@angular/core';
import { User, UserService } from '@b3networks/api/workspace';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MessageConstants } from '@b3networks/chat/shared/core';
import { ToastService } from '@b3networks/shared/ui/toast';

@Component({
  selector: 'b3n-email-add-agent',
  templateUrl: './add-agent-dialog.component.html',
  styleUrls: ['./add-agent-dialog.component.scss']
})
export class AddAgentDialogComponent {
  memberIds: string[] = [];

  constructor(
    private userService: UserService,
    private toastService: ToastService,
    private dialogRef: MatDialogRef<AddAgentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public agents: User[]
  ) {}

  onMembersChanged(memberIds: string[]) {
    this.memberIds = memberIds;
  }

  submit() {
    if (this.memberIds.length > 0) {
      this.userService.updateAgents(this.memberIds).subscribe(
        _ => {
          this.dialogRef.close(this.memberIds);
        },
        error => {
          this.toastService.error(error && error.message ? error.message : MessageConstants.DEFAULT);
        }
      );
    }
  }
}
