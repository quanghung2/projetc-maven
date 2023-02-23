import { Component, OnInit, ElementRef, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { PartnerService } from '../../../core/services';

declare const $;

@Component({
  selector: 'app-update-sender-email-modal',
  templateUrl: './update-sender-email-modal.component.html',
  styleUrls: ['./update-sender-email-modal.component.scss']
})
export class UpdateSenderEmailModalComponent implements OnInit, AfterViewInit, OnDestroy {
  Step = {
    Input: 1,
    Done: 2
  };

  @Output()
  senderEmailChange = new EventEmitter<string>();

  newSenderEmail: string;
  existingEmail: string;
  currentStep = this.Step.Input;
  private modalElement;

  constructor(private el: ElementRef, private partnerService: PartnerService) {}

  ngOnInit() {}

  ngOnDestroy() {
    this.modalElement.remove();
  }

  ngAfterViewInit() {
    this.modalElement = $(this.el.nativeElement).find('.ui.modal').first();
    this.modalElement.modal({});
  }

  show(existingEmail: string) {
    this.existingEmail = existingEmail;
    this.newSenderEmail = null;
    this.currentStep = this.Step.Input;
    this.modalElement.modal('show');
  }

  change() {
    this.partnerService.changeSenderEmail(this.newSenderEmail).subscribe(() => {
      this.currentStep = this.Step.Done;
      this.senderEmailChange.emit(this.newSenderEmail);
    });
  }

  close() {
    this.modalElement.modal('hide');
  }
}
