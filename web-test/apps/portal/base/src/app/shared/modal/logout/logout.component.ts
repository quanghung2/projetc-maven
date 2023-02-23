import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'b3n-signout-modal',
  template: `
    <div>
      <h1 mat-dialog-title>Sign Out</h1>
      <div mat-dialog-content><p>Are you sure you want to sign out?</p></div>
      <div mat-dialog-actions align="end">
        <button mat-button mat-dialog-close>Cancel</button>
        <button mat-raised-button [loading]="progressing" color="primary" (click)="logout()">Sign out</button>
      </div>
    </div>
  `,
  styles: ['.mat-dialog-content {text-align: center;}']
})
export class LogoutDlg {
  progressing: boolean;

  constructor(public dialogRef: MatDialogRef<LogoutDlg>, private router: Router) {}

  logout() {
    this.progressing = true;
    this.router.navigate(['auth', 'logout']);
    this.dialogRef.close();
  }
}
