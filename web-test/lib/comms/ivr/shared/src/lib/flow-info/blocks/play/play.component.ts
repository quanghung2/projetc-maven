import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PlayBlock } from '@b3networks/api/ivr';
import { TestCallComponent } from '../test-call/test-call.component';

@Component({
  selector: 'b3n-play',
  templateUrl: './play.component.html',
  styleUrls: ['./play.component.scss']
})
export class PlayComponent implements OnInit {
  @Input() block: PlayBlock = new PlayBlock();

  constructor(private dialog: MatDialog) {}

  ngOnInit() {}

  openTestCallDialog() {
    this.dialog.open(TestCallComponent, {
      data: this.block
    });
  }
}
