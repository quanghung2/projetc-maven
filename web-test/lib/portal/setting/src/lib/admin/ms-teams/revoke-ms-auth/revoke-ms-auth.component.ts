import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'b3n-revoke-ms-auth',
  templateUrl: './revoke-ms-auth.component.html',
  styleUrls: ['./revoke-ms-auth.component.scss']
})
export class RevokeMsAuthComponent {
  constructor(private dialog: MatDialogRef<RevokeMsAuthComponent>) {
  }

  confirm() {
    this.dialog.close(true);
  }
}
