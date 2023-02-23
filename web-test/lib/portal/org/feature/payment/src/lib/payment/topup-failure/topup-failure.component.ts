import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HashMap } from '@datorama/akita';

@Component({
  selector: 'pop-topup-failure',
  templateUrl: './topup-failure.component.html',
  styleUrls: ['./topup-failure.component.scss']
})
export class TopupFailureComponent implements OnInit {
  message: string;
  source: HashMap<unknown>;

  constructor(@Inject(MAT_DIALOG_DATA) private data, private dialogRef: MatDialogRef<TopupFailureComponent>) {}

  ngOnInit(): void {
    this.message = this.data?.message;
    this.source = this.data.source;
  }
  goBack() {
    this.dialogRef.close();
  }
}
