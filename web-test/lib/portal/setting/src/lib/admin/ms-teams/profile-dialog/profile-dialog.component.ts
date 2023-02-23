import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ProfileDialogData {
  domain: string;
}
@Component({
  selector: 'b3n-profile-dialog',
  templateUrl: './profile-dialog.component.html',
  styleUrls: ['./profile-dialog.component.scss']
})
export class ProfileDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ProfileDialogData) {}
}
