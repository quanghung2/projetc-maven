import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { ChatMessage, IMessBodyData, IMessComponent } from '@b3networks/api/workspace';
import { InfoShowMention } from '../../../core/state/app-state.model';

@Component({
  selector: 'csh-interactive-message',
  templateUrl: './interactive-message.component.html',
  styleUrls: ['./interactive-message.component.scss']
})
export class InteractiveMessageComponent implements OnChanges {
  @Input() message: ChatMessage;

  @Output() showProfile: EventEmitter<InfoShowMention> = new EventEmitter<InfoShowMention>();

  errorFormat: string;
  firstComponents: IMessComponent[];

  constructor() {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']) {
      this.errorFormat =
        !this.message.body?.data ||
        typeof this.message.body?.data === 'string' ||
        !(<IMessBodyData>this.message.body?.data)?.components ||
        (<IMessBodyData>this.message.body?.data)?.components.length === 0
          ? 'Unrenderable message!'
          : null;

      if (!this.errorFormat) {
        this.firstComponents = (this.message.body?.data as IMessBodyData)?.components || [];
      }
    }
  }
}
