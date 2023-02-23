import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'b3n-success-modal',
  template: `
    <div mat-dialog-content>
      <div><mat-icon>check_circle</mat-icon></div>
      <div class="header">DONE</div>
      <div class="text" [innerHTML]="msg"></div>
    </div>
  `,
  styles: [
    `
      .mat-dialog-content {
        margin: 15px 0 20px;
        text-align: center;
      }
      mat-icon {
        font-size: 50px;
        color: #169d6c;
        width: 50px;
      }
      .header {
        font-size: 16px;
        font-weight: 600;
        margin-top: 5px;
      }
      .text {
        color: #414141;
        opacity: 0.8;
        margin-top: 20px;
      }
    `
  ]
})
export class SuccessModalComponent {
  constructor(public dialogRef: MatDialogRef<SuccessModalComponent>, @Inject(MAT_DIALOG_DATA) public msg: string) {
    setTimeout(() => {
      dialogRef.close();
    }, 3000);
  }
}
