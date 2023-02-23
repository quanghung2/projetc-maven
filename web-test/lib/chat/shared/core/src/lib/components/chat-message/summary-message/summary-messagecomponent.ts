import { Component, Input } from '@angular/core';
import { ChatMessage } from '@b3networks/api/workspace';

@Component({
  selector: 'csh-summary-message',
  templateUrl: './summary-message.component.html',
  styleUrls: ['./summary-message.component.scss']
})
export class SummaryMessageComponent {
  @Input() message: ChatMessage;

  constructor() {}
}
