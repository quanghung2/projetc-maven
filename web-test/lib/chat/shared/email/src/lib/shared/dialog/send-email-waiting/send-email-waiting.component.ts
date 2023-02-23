import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { interval } from 'rxjs';

@Component({
  selector: 'b3n-send-email-waiting',
  templateUrl: './send-email-waiting.component.html'
})
export class SendEmailWaitingDlg implements OnInit {
  time = 3;
  constructor(public dialogRef: MatDialogRef<SendEmailWaitingDlg>) {}

  ngOnInit() {
    interval(1000).subscribe(() => this.time--);
    setTimeout(() => {
      this.dialogRef.close({
        isProcess: true
      });
    }, 3000);
  }

  cancel(): void {
    this.dialogRef.close({
      isProcess: false
    });
  }
}
