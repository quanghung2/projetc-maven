import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ChatMessage } from '@b3networks/api/workspace';

@Component({
  selector: 'b3n-email-search-result',
  templateUrl: './search-result.component.html',
  styleUrls: ['./search-result.component.scss']
})
export class EmailSearchResultComponent implements OnInit, OnChanges {
  @Input() loading: boolean;
  @Output() onSelect: EventEmitter<any> = new EventEmitter();
  viewMessages: ChatMessage[] = [];

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {}

  appendResult(messages: ChatMessage[]) {
    if (messages.length) {
      messages.forEach(message => {
        this.viewMessages.push(new ChatMessage(message));
      });
    }
  }

  clearMessage() {
    this.viewMessages = [];
  }

  onViewMessage(convoId: string) {
    this.onSelect.emit(convoId);
  }
}
