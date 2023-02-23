import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmBlock } from '@b3networks/api/ivr';
import { TestCallComponent } from '../test-call/test-call.component';

@Component({
  selector: 'b3n-confirm',
  templateUrl: './confirm.component.html',
  styleUrls: ['./confirm.component.scss']
})
export class ConfirmComponent implements OnInit {
  @Input() block: ConfirmBlock = new ConfirmBlock();

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  openTestCallDialog() {
    this.dialog.open(TestCallComponent, {
      data: this.block
    });
  }
}
