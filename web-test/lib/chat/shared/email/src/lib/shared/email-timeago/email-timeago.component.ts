import { Component, Input } from '@angular/core';

@Component({
  selector: 'b3n-email-timeago',
  templateUrl: './email-timeago.component.html',
  styleUrls: ['./email-timeago.component.scss']
})

export class EmailTimeAgoComponent {
  @Input() ts: number;
}
