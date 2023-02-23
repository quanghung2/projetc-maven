import { Component, Input } from '@angular/core';
import { EmailAddress } from '@b3networks/api/workspace';

@Component({
  selector: 'b3n-email-sender-address',
  templateUrl: './email-sender-address.component.html'
})
export class EmailSenderAddressComponent {
  @Input() fromAddresses: EmailAddress;
}
