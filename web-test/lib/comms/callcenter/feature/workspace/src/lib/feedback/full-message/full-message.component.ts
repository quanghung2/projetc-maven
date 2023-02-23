import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'b3n-full-message',
  templateUrl: './full-message.component.html',
  styleUrls: ['./full-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FullMessageComponent {
  msg: string;

  constructor(@Inject(MAT_DIALOG_DATA) data: string) {
    this.msg = data;
  }
}
