import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RequestDetailLeaves } from '@b3networks/api/leave';
import { User } from '@b3networks/api/workspace';

@Component({
  selector: 'b3n-confirm-disable-notify',
  templateUrl: './confirm-disable-notify.component.html',
  styleUrls: ['./confirm-disable-notify.component.scss']
})
export class ConfirmDisableNotifyComponent implements OnInit {
  constructor(
    private dialogRef: MatDialogRef<ConfirmDisableNotifyComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { user: User; requestLeaveNow: RequestDetailLeaves }
  ) {}

  ngOnInit() {}

  confirm() {
    this.dialogRef.close(true);
  }
}
