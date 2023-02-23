import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { GatherBlock } from '@b3networks/api/ivr';
import { TestCallComponent } from '../test-call/test-call.component';

@Component({
  selector: 'b3n-gather',
  templateUrl: './gather.component.html',
  styleUrls: ['./gather.component.scss']
})
export class GatherComponent implements OnInit, OnChanges {
  @Input() block: GatherBlock;

  constructor(private dialog: MatDialog) {}

  ngOnChanges(changes: SimpleChanges) {}

  ngOnInit() {}

  openTestCallDialog() {
    this.dialog.open(TestCallComponent, {
      data: this.block
    });
  }
}
