import { Component } from '@angular/core';
import { EventStreamService } from '../../../shared/service/event-stream.service';

declare var jQuery: any;
declare var X: any;

@Component({
  selector: 'confirmation',
  templateUrl: './confirmation.component.html',
  styleUrls: ['./confirmation.component.scss']
})
export class ConfirmationComponent {
  title: string = '';
  message: any = '';
  type: string = 'yesno';
  okEvent: any = '';
  cancelEvent: any = '';
  processing: boolean = false;
  showTextbox: boolean = false;
  label: string = '';
  data: any;

  constructor(private eventStreamService: EventStreamService) {
    this.eventStreamService.on('show-confirmation').subscribe(evt => {
      this.title = evt.title;
      this.message = evt.message;
      this.type = evt.type;
      this.okEvent = evt.okEvent;
      this.cancelEvent = evt.cancelEvent;
      if (evt.showTextbox) {
        this.showTextbox = evt.showTextbox;
      } else {
        this.showTextbox = false;
      }
      this.label = evt.label;
      this.data = evt.data;
      this.processing = false;
      this.eventStreamService.trigger('open-modal', 'confirmation-modal');
    });

    this.eventStreamService.on('hide-confirmation').subscribe(evt => {
      this.processing = false;
      this.eventStreamService.trigger('close-modal', 'confirmation-modal');
    });
  }

  ok() {
    this.processing = true;
    this.okEvent.data.newData = `${this.data}`;
    this.eventStreamService.trigger(this.okEvent.event, this.okEvent.data);
  }

  cancel() {
    this.processing = false;
    this.eventStreamService.trigger(this.cancelEvent.event, this.cancelEvent.data);
    this.eventStreamService.trigger('close-modal', 'confirmation-modal');
  }
}
