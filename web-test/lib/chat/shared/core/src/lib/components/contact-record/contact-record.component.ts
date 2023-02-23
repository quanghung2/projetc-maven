import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { User } from '@b3networks/api/workspace';
import { Contact } from '@b3networks/api/contact';

@Component({
  selector: 'b3n-contact-record',
  templateUrl: './contact-record.component.html',
  styleUrls: ['./contact-record.component.scss']
})
export class ContactRecordComponent implements OnInit {
  @Input() member: User;
  @Input() contact: Contact;
  @Input() key: string;
  @Output() callTo: EventEmitter<string> = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {}

  makeCallTo() {
    let number: string;
    if (this.member) {
      number = this.member.mobileNumber;
    }
    if (this.contact) {
      // number = this.contact.numbers;
    }
    this.callTo.emit(number);
  }
}
