import { Component, Input, OnInit } from '@angular/core';
import { EmailAddress } from '@b3networks/api/workspace';

@Component({
  selector: 'b3n-email-address',
  templateUrl: './email-address.component.html',
  styleUrls: ['./email-address.component.scss']
})
export class EmailAddressComponent  {
  @Input() addresses: EmailAddress[] = [];
  @Input() label: string;
}
