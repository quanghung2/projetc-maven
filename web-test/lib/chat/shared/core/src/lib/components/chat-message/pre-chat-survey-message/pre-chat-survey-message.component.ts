import { Component, Input } from '@angular/core';
import { ChatMessage } from '@b3networks/api/workspace';

@Component({
  selector: 'csh-pre-chat-survey-message',
  templateUrl: './pre-chat-survey-message.component.html',
  styleUrls: ['./pre-chat-survey-message.component.scss']
})
export class PreChatSurveyMessageComponent {
  @Input() message: ChatMessage;

  constructor() {}
}
